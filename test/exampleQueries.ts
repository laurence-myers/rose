import {Column} from "../src/query/metamodel";
import {QLocations, QRecurringPayments} from "./fixtures";
import {and, col, or, select} from "../src/query/dsl";
import {now} from "../src/query/postgresql/functions/dateTime/functions";
import * as assert from "assert";

describe(`Example queries`, function () {
	describe(`Recurring payments`, function () {
		/**
		 SELECT DISTINCT ON ("locationId")
		   *
		 FROM
		   "RecurringPayments"
		 JOIN "Locations" as loc ON loc."id" = "locationId"
		 WHERE
		   "nextDate" >= :now
		 AND loc."clientId" = :clientId
		 AND (
		   "endDate" IS NULL
		   OR "endDate" > "nextDate"
		 )
		 ORDER BY "locationId", "nextDate" ASC;
		 */
		it(`find the next active payment for all locations under a given client`, function () {
			const QRP = QRecurringPayments; // alias for brevity
			class QueryClass {
				@Column(QRP.id)
				id : number;

				@Column(QLocations.id)
				locationId : number;
			}
			const params = {
				clientId: 123
			};
			const query = select(QueryClass)
				.distinctOn(col(QRP.locationId))
				.join(QLocations)
				.on(QLocations.id.eq(QRP.locationId))
				.where(and(
					QRP.nextDate.gte(now()),
					QLocations.clientId.eq((p) => p.clientId),
					or(
						QRP.endDate.isNull(),
						QRP.endDate.gt(QRP.nextDate)
					)
				)).orderBy(
					QRP.locationId.asc(),
					QRP.nextDate.asc()
				);

			const result = query.toSql(params);

			const expected = ('SELECT DISTINCT ON ' +
				'("t2"."locationId") ' +
				'"t2"."id" as "id", "t1"."id" as "locationId" ' +
				'FROM "RecurringPayments" as "t2" ' +
				'INNER JOIN "Locations" as "t1" ON "t1"."id" = "t2"."locationId" ' +
				'WHERE ' +
				'("t2"."nextDate" >= now() AND ' +
				'"t1"."clientId" = $1 AND ' +
				'("t2"."endDate" IS NULL OR ' +
				'"t2"."endDate" > "t2"."nextDate")) ' +
				'ORDER BY "t2"."locationId" ASC, "t2"."nextDate" ASC');
			assert.equal(result.sql, expected);
		});
	});
});
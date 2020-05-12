import {
	QBuilderTemplateCategories,
	QBuilderTemplates,
	QBuilderTemplateTags,
	QBuilderTemplateToCategoryMap,
	QLocations,
	QOrders,
	QRecurringPayments,
	QTags,
	QUploads
} from "../fixtures";
import { select } from "../../src/query/dsl/commands";
import { now, overlaps } from "../../src/query/postgresql/functions/dateTime/functions";
import * as assert from "assert";
import { exists } from "../../src/query/postgresql/functions/subquery/expressions";
import { sum } from "../../src/query/postgresql/functions/aggregate/general";
import { divide } from "../../src/query/postgresql/functions/mathematical/operators";
import { selectCte, selectExpression, selectNestedMany, subSelect } from "../../src/query/dsl/select";
import { and, col, constant, literal, or, row } from "../../src/query/dsl/core";
import { params, withParams } from "../../src/query/params";

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
			const querySelect = {
				id: QRP.id,

				locationId: QLocations.id,
			};
			const params = {
				clientId: 123
			};
			const query = withParams<{ clientId: number }>()(
				(p) => select(querySelect)
				.distinctOn(col(QRP.locationId))
				.join(QLocations)
				.on(QLocations.id.eq(QRP.locationId))
				.where(and(
					QRP.nextDate.gte(now()),
					QLocations.clientId.eq(p.clientId),
					or(
						QRP.endDate.isNull(),
						QRP.endDate.gt(QRP.nextDate)
					)
				)).orderBy(
					QRP.locationId.asc(),
					QRP.nextDate.asc()
				).finalise(p)
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

		/**
		 SELECT
		 EXISTS
		 (
			 SELECT
			 	*
			 FROM
			 	"RecurringPayments"
			 WHERE
			 	"locationId" = :locationId
			 AND ( (
			 	"endDate" IS NULL
			 	AND "startDate" = :startDate )
			 	OR  (
			 		"startDate", "endDate") OVERLAPS (:startDate, :endDate) )
			 LIMIT 1
		 ) AS "exists";
		 */
		it(`there exists a payment with a date range overlapping the given dates and location`, function () {
			const QRP = QRecurringPayments; // alias for brevity

			// Make our parameters type safe
			interface QueryParams {
				startDate: Date;
				endDate: Date;
				locationId: number;
			}
			// Make our use of parameters within the sub-query type safe
			const P = params<QueryParams>();
			// Define our sub-query before the query class. (We could also define it inline, at the expense of readability.)
			const subQuery = subSelect<QueryParams>(QRP.id)
				.where(and(
					QRP.locationId.eq(P.locationId),
					or(
						and(
							QRP.endDate.isNull(),
							QRP.startDate.eq(P.startDate)
						),
						overlaps(
							row(col(QRP.startDate), col(QRP.endDate)),
							row(P.startDate, P.endDate)
						)
					)
				))
				.limit(constant(1))
				.toSubQuery();
			// Make the returned values type safe.
			const querySelect = {
				exists: selectExpression(exists(subQuery))
			};

			const query = select(querySelect).finalise(P);

			const result = query.toSql({
				startDate: new Date(Date.parse("2017-05-11")),
				endDate: new Date(Date.parse("2017-06-11")),
				locationId: 123
			});

			const expected = 'SELECT EXISTS (' +
				'SELECT "t1"."id" FROM "RecurringPayments" as "t1" ' +
				'WHERE ("t1"."locationId" = $1 AND ' +
				'(' +
					'("t1"."endDate" IS NULL AND "t1"."startDate" = $2) ' +
					'OR ("t1"."startDate", "t1"."endDate") OVERLAPS ($3, $4))' +
				') ' +
				'LIMIT $5 OFFSET $6) ' +
				'as "exists"';

			assert.equal(result.sql, expected);
		});
	});

	describe(`Builder templates`, function () {
		interface FindAllCriteria {
			categories? : number[];
			clients? : number[];
			tags? : string;
			platforms? : number[];
		}

		interface Page {
			limit? : number;
			offset? : number;
		}

		interface Params extends Page {
			criteria: FindAllCriteria;
		}

		const Upload = {
			id: QUploads.id,
		};

		const Tag = {
			id: QTags.id,

			title: QTags.title,
		};

		const BuilderTemplateCategory = {
			id: QBuilderTemplateCategories.id,

			groupLabel: QBuilderTemplateCategories.groupLabel,

			label: QBuilderTemplateCategories.label,

			width: QBuilderTemplateCategories.width,

			height: QBuilderTemplateCategories.height,

			platformId: QBuilderTemplateCategories.platformId,
		};

		const BuilderTemplate = {
			id: QBuilderTemplates.id,

			title: QBuilderTemplates.title,

			createdAt: QBuilderTemplates.createdAt,

			clientId: QBuilderTemplates.clientId,

			compositeImage: selectNestedMany(Upload),

			tags: selectNestedMany(Tag),

			categories: selectNestedMany(BuilderTemplateCategory),
		};

		function prepareDynamicQuery(params: Params) {
			// Let's assign some locals for brevity
			const QCategories = QBuilderTemplateCategories;
			const QCategoryMap = QBuilderTemplateToCategoryMap;

			let idSubQueryBuilder = subSelect<Params>(QBuilderTemplates.id)
				.orderBy(QBuilderTemplates.createdAt.desc())
				.limit(constant(10), constant(0));
			if (params.criteria.clients) {
				idSubQueryBuilder = idSubQueryBuilder.where(QBuilderTemplates.clientId.eqAny(() => params.criteria.clients || []));
			} else if (params.criteria.platforms) {
				idSubQueryBuilder = idSubQueryBuilder.where(and(
					QBuilderTemplateCategories.platformId.eqAny(() => params.criteria.platforms || []),
					QBuilderTemplateToCategoryMap.builderTemplateId.eq(QBuilderTemplates.id),
					QBuilderTemplateToCategoryMap.builderTemplateCategoryId.eq(QBuilderTemplateCategories.id)
				));
			}
			const idSubQuery = idSubQueryBuilder.toSubQuery();

			return select(BuilderTemplate)
				.join(QCategoryMap)
				.on(QCategoryMap.builderTemplateId.eq(QBuilderTemplates.id))
				.join(QCategories)
				.on(QCategories.id.eq(QCategoryMap.builderTemplateCategoryId))
				.join(QBuilderTemplateTags)
				.on(QBuilderTemplateTags.builderTemplateId.eq(QBuilderTemplates.id))
				.join(QTags)
				.on(QTags.id.eq(QBuilderTemplateTags.tagId))
				.join(QUploads)
				.on(QUploads.id.eq(QBuilderTemplates.compositeImageId))
				.where(QBuilderTemplates.id.in(idSubQuery))
				.finalise({})
				.toSql(params);
		}

		it(`find all by client IDs`, function () {
			const result = prepareDynamicQuery({
				criteria: {
					clients: [1]
				},
				limit: 10,
				offset: 0
			});
			assert.equal(result.sql, `SELECT "t6"."id" as "id", "t6"."title" as "title", "t6"."createdAt" as "createdAt", "t6"."clientId" as "clientId", "t5"."id" as "compositeImage.id", "t4"."id" as "tags.id", "t4"."title" as "tags.title", "t2"."id" as "categories.id", "t2"."groupLabel" as "categories.groupLabel", "t2"."label" as "categories.label", "t2"."width" as "categories.width", "t2"."height" as "categories.height", "t2"."platformId" as "categories.platformId" FROM "BuilderTemplates" as "t6" INNER JOIN "BuilderTemplateToCategoryMap" as "t1" ON "t1"."builderTemplateId" = "t6"."id"INNER JOIN "BuilderTemplateCategories" as "t2" ON "t2"."id" = "t1"."builderTemplateCategoryId"INNER JOIN "BuilderTemplateTags" as "t3" ON "t3"."builderTemplateId" = "t6"."id"INNER JOIN "Tags" as "t4" ON "t4"."id" = "t3"."tagId"INNER JOIN "Uploads" as "t5" ON "t5"."id" = "t6"."compositeImageId" WHERE "t6"."id" IN (SELECT "t6"."id" FROM "BuilderTemplates" as "t6" WHERE "t6"."clientId" = ANY($1) ORDER BY "t6"."createdAt" DESC LIMIT $2 OFFSET $3)`);
			assert.deepEqual(result.parameters, [[1], 10, 0]);
		});

		it(`find all by platforms`, function () {
			const result = prepareDynamicQuery({
				criteria: {
					platforms: [123]
				},
				limit: 10,
				offset: 0
			});
			assert.equal(result.sql, `SELECT "t6"."id" as "id", "t6"."title" as "title", "t6"."createdAt" as "createdAt", "t6"."clientId" as "clientId", "t5"."id" as "compositeImage.id", "t4"."id" as "tags.id", "t4"."title" as "tags.title", "t2"."id" as "categories.id", "t2"."groupLabel" as "categories.groupLabel", "t2"."label" as "categories.label", "t2"."width" as "categories.width", "t2"."height" as "categories.height", "t2"."platformId" as "categories.platformId" FROM "BuilderTemplates" as "t6" INNER JOIN "BuilderTemplateToCategoryMap" as "t1" ON "t1"."builderTemplateId" = "t6"."id"INNER JOIN "BuilderTemplateCategories" as "t2" ON "t2"."id" = "t1"."builderTemplateCategoryId"INNER JOIN "BuilderTemplateTags" as "t3" ON "t3"."builderTemplateId" = "t6"."id"INNER JOIN "Tags" as "t4" ON "t4"."id" = "t3"."tagId"INNER JOIN "Uploads" as "t5" ON "t5"."id" = "t6"."compositeImageId" WHERE "t6"."id" IN (SELECT "t6"."id" FROM "BuilderTemplates" as "t6", "BuilderTemplateCategories" as "t2", "BuilderTemplateToCategoryMap" as "t1" WHERE ("t2"."platformId" = ANY($1) AND "t1"."builderTemplateId" = "t6"."id" AND "t1"."builderTemplateCategoryId" = "t2"."id") ORDER BY "t6"."createdAt" DESC LIMIT $2 OFFSET $3)`);
			assert.deepEqual(result.parameters, [[123], 10, 0]);
		});
	});

	describe(`Common Table Expressions (CTE)`, function () {
		/**
		 * WITH regional_sales AS (
		 *			SELECT region, SUM(amount) AS total_sales
		 *			FROM orders
		 *			GROUP BY region
		 *		 ), top_regions AS (
		 *			SELECT region
		 *			FROM regional_sales
		 *			WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
		 *		 )
		 *	SELECT region,
		 *		   product,
		 *		   SUM(quantity) AS product_units,
		 *		   SUM(amount) AS product_sales
		 *	FROM orders
		 *	WHERE region IN (SELECT region FROM top_regions)
		 *	GROUP BY region, product;
		 */
		it(`can query a CTE`, function () {
			const regionalSales = selectCte(`regional_sales`, {
				region: QOrders.region,
				total_sales: selectExpression(sum(QOrders.amount.col()))
			})
				.groupBy(QOrders.region);
			const regionalSalesMetamodel = regionalSales.toMetamodel();
			const topRegions = selectCte(`top_regions`, {
				region: regionalSalesMetamodel.region
			})
				.where(regionalSalesMetamodel.total_sales.gt(
					subSelect(divide(sum(regionalSalesMetamodel.total_sales.col()), literal("10")))
						.toSubQuery()
				));

			const query = select({
				region: QOrders.region,
				product: QOrders.product,
				product_units: selectExpression(sum(QOrders.quantity.col())),
				product_sales: selectExpression(sum(QOrders.amount.col()))
			})
				.with(regionalSales.toNode(), topRegions.toNode())
				.where(QOrders.region.in(
					subSelect(topRegions.toMetamodel().region)
						.toSubQuery()
				))
				.groupBy(QOrders.region, QOrders.product);

			const result = query.finalise({}).toSql({});
			assert.equal(result.sql, 'WITH "regional_sales" as (SELECT "t1"."region" as "region", sum("t1"."amount") as "total_sales" FROM "orders" as "t1" GROUP BY ("t1"."region")), "top_regions" as (SELECT "t1"."region" as "region" FROM "regional_sales" as "t1" WHERE "t1"."total_sales" > (SELECT sum("t1"."total_sales") / 10 FROM "regional_sales" as "t1")) SELECT "t2"."region" as "region", "t2"."product" as "product", sum("t2"."quantity") as "product_units", sum("t2"."amount") as "product_sales" FROM "orders" as "t2" WHERE "t2"."region" IN (SELECT "t1"."region" FROM "top_regions" as "t1") GROUP BY ("t2"."region", "t2"."product")');
		});

		/**
		 * WITH RECURSIVE t(n) AS (
		 * VALUES (1)
		 * UNION ALL
		 * SELECT n+1 FROM t WHERE n < 100
		 * )
		 * SELECT sum(n) FROM t;
		 */
		xit(`can query a recursive CTE`, function () {

		})
	});
});

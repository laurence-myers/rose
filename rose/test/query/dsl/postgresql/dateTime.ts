import { col, constant, overlaps } from "../../../../src";
import { doSimpleSqlTest } from "../../../test-utils";
import { QRecurringPayments } from "../../../fixtures";

describe(`dateTime`, () => {
	describe(`functions`, () => {
		describe(overlaps.name, () => {
			it(`accepts four args`, () => {
				const QRP = QRecurringPayments; // alias for brevity
				const astNode = overlaps(
					col(QRP.startDate),
					col(QRP.endDate),
					constant(1),
					constant(2)
				);
				const expected = `("RecurringPayments"."startDate", "RecurringPayments"."endDate") OVERLAPS ($1, $2)`;
				doSimpleSqlTest(astNode, expected);
			});
		});
	});
});

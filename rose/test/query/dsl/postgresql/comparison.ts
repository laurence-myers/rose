import {
	AstNode,
	constant,
	eq,
	equal,
	greaterThan,
	greaterThanOrEqual,
	gt,
	gte,
	lessThan,
	lessThanOrEqual,
	lt,
	lte,
	neq,
	notEqual
} from "../../../../src";
import { QUsers } from "../../../fixtures";
import { doSimpleSqlTest } from "../../../test-utils";

describe(`comparison`, () => {
	describe(`operators`, () => {
		const cases = new Map<string, { astNode: AstNode; expected: string }>([
			[equal.name,
				{
					astNode: equal(constant('foo'), QUsers.name.col()),
					expected: `$1 = "t1"."name"`
				}
			],
			['eq',
				{
					astNode: eq(constant('foo'), QUsers.name.col()),
					expected: `$1 = "t1"."name"`
				}
			],
			[greaterThan.name,
				{
					astNode: greaterThan(constant('foo'), QUsers.name.col()),
					expected: `$1 > "t1"."name"`
				}
			],
			['gt',
				{
					astNode: gt(constant('foo'), QUsers.name.col()),
					expected: `$1 > "t1"."name"`
				}
			],
			[greaterThanOrEqual.name,
				{
					astNode: greaterThanOrEqual(constant('foo'), QUsers.name.col()),
					expected: `$1 >= "t1"."name"`
				}
			],
			['gte',
				{
					astNode: gte(constant('foo'), QUsers.name.col()),
					expected: `$1 >= "t1"."name"`
				}
			],
			[lessThan.name,
				{
					astNode: lessThan(constant('foo'), QUsers.name.col()),
					expected: `$1 < "t1"."name"`
				}
			],
			['lt',
				{
					astNode: lt(constant('foo'), QUsers.name.col()),
					expected: `$1 < "t1"."name"`
				}
			],
			[lessThanOrEqual.name,
				{
					astNode: lessThanOrEqual(constant('foo'), QUsers.name.col()),
					expected: `$1 <= "t1"."name"`
				}
			],
			['lte',
				{
					astNode: lte(constant('foo'), QUsers.name.col()),
					expected: `$1 <= "t1"."name"`
				}
			],
			[notEqual.name,
				{
					astNode: notEqual(constant('foo'), QUsers.name.col()),
					expected: `$1 != "t1"."name"`
				}
			],
			['neq',
				{
					astNode: neq(constant('foo'), QUsers.name.col()),
					expected: `$1 != "t1"."name"`
				}
			],
		]);

		for (const [caseName, { astNode, expected }] of cases) {
			it(`produces expected SQL for ${caseName}`, () => {
				doSimpleSqlTest(astNode, expected);
			});
		}
	});
});

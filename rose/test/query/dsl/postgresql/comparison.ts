import {
	AstNode,
	between,
	betweenSymmetric,
	constant,
	eq,
	equal,
	greaterThan,
	greaterThanOrEqual,
	gt,
	gte,
	isDistinctFrom,
	isFalse,
	isNotDistinctFrom,
	isNotFalse,
	isNotNull,
	isNotTrue,
	isNotUnknown,
	isNull,
	isTrue,
	isUnknown,
	lessThan,
	lessThanOrEqual,
	lt,
	lte,
	neq,
	notBetween,
	notEqual,
	null_,
	num_nonnulls,
	num_nulls,
	param,
} from "../../../../src";
import { QOrders, QUsers } from "../../../fixtures";
import { doSimpleSqlTest } from "../../../test-utils";

interface SimpleCaseEntry {
	astNode: AstNode;
	expected: string;
}

/**
 * @see https://www.postgresql.org/docs/current/functions-comparison.html
 */
describe(`comparison`, () => {
	describe(`functions`, () => {
		const cases = new Map<string, SimpleCaseEntry>([
			[
				num_nonnulls.name,
				{
					astNode: num_nonnulls(
						constant("foo"),
						null_(),
						param(() => 1)
					),
					expected: `num_nonnulls($1, NULL, $2)`,
				},
			],
			[
				num_nulls.name,
				{
					astNode: num_nulls(
						constant("foo"),
						null_(),
						param(() => 1)
					),
					expected: `num_nulls($1, NULL, $2)`,
				},
			],
		]);

		for (const [caseName, { astNode, expected }] of cases) {
			it(`produces expected SQL for ${caseName}`, () => {
				doSimpleSqlTest(astNode, expected);
			});
		}
	});

	describe(`operators`, () => {
		const cases = new Map<string, SimpleCaseEntry>([
			[
				equal.name,
				{
					astNode: equal(constant("foo"), QUsers.name.col()),
					expected: `$1 = "t1"."name"`,
				},
			],
			[
				"eq",
				{
					astNode: eq(constant("foo"), QUsers.name.col()),
					expected: `$1 = "t1"."name"`,
				},
			],
			[
				greaterThan.name,
				{
					astNode: greaterThan(constant("foo"), QUsers.name.col()),
					expected: `$1 > "t1"."name"`,
				},
			],
			[
				"gt",
				{
					astNode: gt(constant("foo"), QUsers.name.col()),
					expected: `$1 > "t1"."name"`,
				},
			],
			[
				greaterThanOrEqual.name,
				{
					astNode: greaterThanOrEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 >= "t1"."name"`,
				},
			],
			[
				"gte",
				{
					astNode: gte(constant("foo"), QUsers.name.col()),
					expected: `$1 >= "t1"."name"`,
				},
			],
			[
				lessThan.name,
				{
					astNode: lessThan(constant("foo"), QUsers.name.col()),
					expected: `$1 < "t1"."name"`,
				},
			],
			[
				"lt",
				{
					astNode: lt(constant("foo"), QUsers.name.col()),
					expected: `$1 < "t1"."name"`,
				},
			],
			[
				lessThanOrEqual.name,
				{
					astNode: lessThanOrEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 <= "t1"."name"`,
				},
			],
			[
				"lte",
				{
					astNode: lte(constant("foo"), QUsers.name.col()),
					expected: `$1 <= "t1"."name"`,
				},
			],
			[
				notEqual.name,
				{
					astNode: notEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 != "t1"."name"`,
				},
			],
			[
				"neq",
				{
					astNode: neq(constant("foo"), QUsers.name.col()),
					expected: `$1 != "t1"."name"`,
				},
			],
		]);

		for (const [caseName, { astNode, expected }] of cases) {
			it(`produces expected SQL for ${caseName}`, () => {
				doSimpleSqlTest(astNode, expected);
			});
		}
	});

	describe(`predicates`, () => {
		const cases = new Map<string, SimpleCaseEntry>([
			[
				between.name,
				{
					astNode: between(QOrders.amount.col(), constant(1), constant(5)),
					expected: `"t1"."amount" BETWEEN $1 AND $2`,
				},
			],
			[
				betweenSymmetric.name,
				{
					astNode: betweenSymmetric(
						QOrders.amount.col(),
						constant(1),
						constant(5)
					),
					expected: `"t1"."amount" BETWEEN SYMMETRIC $1 AND $2`,
				},
			],
			[
				isDistinctFrom.name,
				{
					astNode: isDistinctFrom(QOrders.amount.col(), constant(1)),
					expected: `"t1"."amount" IS DISTINCT FROM $1`,
				},
			],
			[
				isFalse.name,
				{
					astNode: isFalse(QOrders.amount.col()),
					expected: `"t1"."amount" IS FALSE`,
				},
			],
			[
				isNotDistinctFrom.name,
				{
					astNode: isNotDistinctFrom(QOrders.amount.col(), constant(1)),
					expected: `"t1"."amount" IS NOT DISTINCT FROM $1`,
				},
			],
			[
				isNotFalse.name,
				{
					astNode: isNotFalse(QOrders.amount.col()),
					expected: `"t1"."amount" IS NOT FALSE`,
				},
			],
			[
				isNotNull.name,
				{
					astNode: isNotNull(QOrders.amount.col()),
					expected: `"t1"."amount" IS NOT NULL`,
				},
			],
			[
				isNotTrue.name,
				{
					astNode: isNotTrue(QOrders.amount.col()),
					expected: `"t1"."amount" IS NOT TRUE`,
				},
			],
			[
				isNotUnknown.name,
				{
					astNode: isNotUnknown(QOrders.amount.col()),
					expected: `"t1"."amount" IS NOT UNKNOWN`,
				},
			],
			[
				isNull.name,
				{
					astNode: isNull(QOrders.amount.col()),
					expected: `"t1"."amount" IS NULL`,
				},
			],
			[
				isTrue.name,
				{
					astNode: isTrue(QOrders.amount.col()),
					expected: `"t1"."amount" IS TRUE`,
				},
			],
			[
				isUnknown.name,
				{
					astNode: isUnknown(QOrders.amount.col()),
					expected: `"t1"."amount" IS UNKNOWN`,
				},
			],
			[
				notBetween.name,
				{
					astNode: notBetween(QOrders.amount.col(), constant(1), constant(5)),
					expected: `"t1"."amount" NOT BETWEEN $1 AND $2`,
				},
			],
		]);

		for (const [caseName, { astNode, expected }] of cases) {
			it(`produces expected SQL for ${caseName}`, () => {
				doSimpleSqlTest(astNode, expected);
			});
		}
	});
});

import {
	all,
	any,
	array_,
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
	some,
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
					expected: `$1 = "Users"."name"`,
				},
			],
			[
				"eq",
				{
					astNode: eq(constant("foo"), QUsers.name.col()),
					expected: `$1 = "Users"."name"`,
				},
			],
			[
				greaterThan.name,
				{
					astNode: greaterThan(constant("foo"), QUsers.name.col()),
					expected: `$1 > "Users"."name"`,
				},
			],
			[
				"gt",
				{
					astNode: gt(constant("foo"), QUsers.name.col()),
					expected: `$1 > "Users"."name"`,
				},
			],
			[
				greaterThanOrEqual.name,
				{
					astNode: greaterThanOrEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 >= "Users"."name"`,
				},
			],
			[
				"gte",
				{
					astNode: gte(constant("foo"), QUsers.name.col()),
					expected: `$1 >= "Users"."name"`,
				},
			],
			[
				lessThan.name,
				{
					astNode: lessThan(constant("foo"), QUsers.name.col()),
					expected: `$1 < "Users"."name"`,
				},
			],
			[
				"lt",
				{
					astNode: lt(constant("foo"), QUsers.name.col()),
					expected: `$1 < "Users"."name"`,
				},
			],
			[
				lessThanOrEqual.name,
				{
					astNode: lessThanOrEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 <= "Users"."name"`,
				},
			],
			[
				"lte",
				{
					astNode: lte(constant("foo"), QUsers.name.col()),
					expected: `$1 <= "Users"."name"`,
				},
			],
			[
				notEqual.name,
				{
					astNode: notEqual(constant("foo"), QUsers.name.col()),
					expected: `$1 != "Users"."name"`,
				},
			],
			[
				"neq",
				{
					astNode: neq(constant("foo"), QUsers.name.col()),
					expected: `$1 != "Users"."name"`,
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
					expected: `"orders"."amount" BETWEEN $1 AND $2`,
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
					expected: `"orders"."amount" BETWEEN SYMMETRIC $1 AND $2`,
				},
			],
			[
				isDistinctFrom.name,
				{
					astNode: isDistinctFrom(QOrders.amount.col(), constant(1)),
					expected: `"orders"."amount" IS DISTINCT FROM $1`,
				},
			],
			[
				isFalse.name,
				{
					astNode: isFalse(QOrders.amount.col()),
					expected: `"orders"."amount" IS FALSE`,
				},
			],
			[
				isNotDistinctFrom.name,
				{
					astNode: isNotDistinctFrom(QOrders.amount.col(), constant(1)),
					expected: `"orders"."amount" IS NOT DISTINCT FROM $1`,
				},
			],
			[
				isNotFalse.name,
				{
					astNode: isNotFalse(QOrders.amount.col()),
					expected: `"orders"."amount" IS NOT FALSE`,
				},
			],
			[
				isNotNull.name,
				{
					astNode: isNotNull(QOrders.amount.col()),
					expected: `"orders"."amount" IS NOT NULL`,
				},
			],
			[
				isNotTrue.name,
				{
					astNode: isNotTrue(QOrders.amount.col()),
					expected: `"orders"."amount" IS NOT TRUE`,
				},
			],
			[
				isNotUnknown.name,
				{
					astNode: isNotUnknown(QOrders.amount.col()),
					expected: `"orders"."amount" IS NOT UNKNOWN`,
				},
			],
			[
				isNull.name,
				{
					astNode: isNull(QOrders.amount.col()),
					expected: `"orders"."amount" IS NULL`,
				},
			],
			[
				isTrue.name,
				{
					astNode: isTrue(QOrders.amount.col()),
					expected: `"orders"."amount" IS TRUE`,
				},
			],
			[
				isUnknown.name,
				{
					astNode: isUnknown(QOrders.amount.col()),
					expected: `"orders"."amount" IS UNKNOWN`,
				},
			],
			[
				notBetween.name,
				{
					astNode: notBetween(QOrders.amount.col(), constant(1), constant(5)),
					expected: `"orders"."amount" NOT BETWEEN $1 AND $2`,
				},
			],
		]);

		for (const [caseName, { astNode, expected }] of cases) {
			it(`produces expected SQL for ${caseName}`, () => {
				doSimpleSqlTest(astNode, expected);
			});
		}
	});

	describe(`rowAndArrayComparisons`, () => {
		const cases = new Map<string, SimpleCaseEntry>([
			[
				all.name,
				{
					astNode: eq(
						QOrders.amount.col(),
						all(array_(constant(1), constant(5)))
					),
					expected: `"orders"."amount" = ALL(ARRAY[$1, $2])`,
				},
			],
			[
				any.name,
				{
					astNode: eq(
						QOrders.amount.col(),
						any(array_(constant(1), constant(5)))
					),
					expected: `"orders"."amount" = ANY(ARRAY[$1, $2])`,
				},
			],
			[
				"some",
				{
					astNode: eq(
						QOrders.amount.col(),
						some(array_(constant(1), constant(5)))
					),
					expected: `"orders"."amount" = ANY(ARRAY[$1, $2])`,
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

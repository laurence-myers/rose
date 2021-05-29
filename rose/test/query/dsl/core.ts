import { and, arrayConstructor, constant, isTrue, NotEnoughExpressionsError, or, row, subSelect } from "../../../src";
import { doSimpleSqlTest } from "../../test-utils";
import { QOrders } from "../../fixtures";
import { SqlAstWalker } from "../../../src/query/walkers/sqlAstWalker";
import * as assert from 'assert';

describe(`core`, () => {
	const andOrCases = [
		[
			and,
			'and', // internal operator
			'AND' // output SQL
		],
		[
			or,
			'or', // internal operator
			'OR' // output SQL
		]
	] as const;

	for (const [dslFunc, internalOperator, outputOperator] of andOrCases) {
		describe(dslFunc.name, () => {
			it(`requires at least two arguments`, () => {
				dslFunc(
					// @ts-expect-error Passing a single argument is not allowed
					isTrue(constant(true)),
				);
			});

			it(`accepts two arguments`, () => {
				const astNode = dslFunc(
					isTrue(constant(true)),
					QOrders.amount.gte(constant(10))
				);
				const expected = `($1 IS TRUE ${ outputOperator } "t1"."amount" >= $2)`;
				doSimpleSqlTest(astNode, expected);
			});

			it(`accepts more than two arguments`, () => {
				const astNode = dslFunc(
					isTrue(constant(true)),
					QOrders.amount.gte(constant(10)),
					QOrders.product.eq(constant('foo'))
				);
				const expected = `($1 IS TRUE ${ outputOperator } "t1"."amount" >= $2 ${ outputOperator } "t1"."product" = $3)`;
				doSimpleSqlTest(astNode, expected);
			});

			it(`accepts one argument if it's an array`, () => {
				const astNode = dslFunc(
					[
						isTrue(constant(true)),
						QOrders.amount.gte(constant(10)),
						QOrders.product.eq(constant('foo'))
					]
				);
				const expected = `($1 IS TRUE ${ outputOperator } "t1"."amount" >= $2 ${ outputOperator } "t1"."product" = $3)`;
				doSimpleSqlTest(astNode, expected);
			});

			it(`does not accept multiple arguments if the first argument is an array`, () => {
				dslFunc(
					// @ts-expect-error Passing multiple arguments is not allowed if the first argument is an array
					[
						isTrue(constant(true)),
						QOrders.amount.gte(constant(10))
					],
					QOrders.product.eq(constant('foo'))
				);
			});

			it(`throws an error if the first argument is an array with length < 2`, () => {
				const cases = [
					[],
					[
						isTrue(constant(true))
					]
				];
				for (const expressionsArray of cases) {
					const astNode = dslFunc(
						expressionsArray
					);
					const expectedMessage = `Boolean expression group for "${ internalOperator }" does not have enough expressions. Needed: 2, found: ${ expressionsArray.length }`;
					assert.throws(() => {
						new SqlAstWalker(astNode).toSql();
					}, new NotEnoughExpressionsError(expectedMessage));
				}
			});
		});
	}

	describe(`array constructor`, () => {
		it(`accepts zero arguments`, () => {
			const astNode = arrayConstructor();
			const expected = `ARRAY[]`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`accepts one argument`, () => {
			const astNode = arrayConstructor(constant(true));
			const expected = `ARRAY[$1]`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`accepts a single subquery`, () => {
			const astNode = arrayConstructor(subSelect(QOrders.product).toSubQuery());
			// TODO: rectify table references in subqueries in array constructors
			const expected = `ARRAY(SELECT "t1"."product")`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`does not accept multiple arguments if one is a sub-query`, () => {
			arrayConstructor(
				// @ts-expect-error Arrays constructed from a sub-query don't accept multiple args
				subSelect(QOrders.product).toSubQuery(),
				constant(true)
			);
		});
	});

	describe(`row constructor`, () => {
		it(`accepts one argument`, () => {
			const astNode = row(constant(true));
			const expected = `ROW($1)`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`accepts more than one argument`, () => {
			const astNode = row(constant(true), QOrders.amount.col());
			const expected = `ROW($1, "t1"."amount")`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`accepts one argument as an array`, () => {
			const astNode = row(
				[
					constant(true),
					QOrders.amount.col()
				]
			);
			const expected = `ROW($1, "t1"."amount")`;
			doSimpleSqlTest(astNode, expected);
		});

		it(`does not accept multiple arguments if the first is an array`, () => {
			row(
				// @ts-expect-error Passing multiple arguments is not allowed if the first argument is an array
				[
					constant(true),
				],
				QOrders.amount.col()
			);
		});
	});
});

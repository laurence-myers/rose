import {
	QAgencies,
	QChild,
	QLocations,
	QOtherChild,
	QParent,
	QRecurringPayments,
	QUsers,
	TLocations,
} from "../../../fixtures";
import { lower } from "../../../../src/query/dsl/postgresql/string/sql";
import {
	count,
	sum,
} from "../../../../src/query/dsl/postgresql/aggregate/general";
import { deepFreeze } from "../../../../src/lang";
import { select } from "../../../../src/query/dsl/commands";
import {
	selectExists,
	selectExpression,
	selectNestedMany,
	selectSubQuery,
	subSelect,
} from "../../../../src/query/dsl/select";
import {
	and,
	cast,
	col,
	constant,
	not,
	or,
} from "../../../../src/query/dsl/core";
import { params, ParamsProxy, withParams } from "../../../../src/query/params";
import {
	exists,
	FinalisedQueryWithParams,
	innerJoin,
} from "../../../../src/query";
import assert = require("assert");

describe(`SELECT commands`, () => {
	function wrapQuery<TParams = never>(
		cb: (p: ParamsProxy<TParams>) => {
			finalise(
				params: ParamsProxy<TParams>
			): FinalisedQueryWithParams<any, TParams>;
		},
		parameters: TParams
	) {
		const p = params<TParams>();
		const query = cb(p);
		return query.finalise(p).toSql(parameters);
	}

	it("supports selecting and where clause from one table, with an immediate value (param)", function () {
		const querySelect = {
			id: QUsers.id,
		};

		interface QueryParams {
			userId: number;
		}
		const parameterValues = {
			userId: 1,
		};
		const actual = wrapQuery<QueryParams>(
			(p) => select(querySelect).where(QUsers.id.eq(p.userId)),
			parameterValues
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE "Users"."id" = $1`,
			parameters: [1],
		};
		assert.deepEqual(actual, expected);
	});

	it("supports calling `where()` multiple times", function () {
		const querySelect = {
			id: QUsers.id,
		};

		interface QueryParams {
			userId: number;
		}
		const parameterValues = {
			userId: 1,
		};
		const actual = wrapQuery<QueryParams>(
			(p) =>
				select(querySelect)
					.where(QUsers.id.eq(p.userId))
					.where(QUsers.name.eq(constant("Phileas"))),
			parameterValues
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE ("Users"."id" = $1 AND "Users"."name" = $2)`,
			parameters: [1, "Phileas"],
		};
		assert.deepEqual(actual, expected);
	});

	it("can replace all existing `where()` clauses", function () {
		const querySelect = {
			id: QUsers.id,
		};

		interface QueryParams {
			userId: number;
		}
		const parameterValues = {
			userId: 1,
		};
		const actual = wrapQuery<QueryParams>(
			(p) =>
				select(querySelect)
					.where(QUsers.id.eq(p.userId))
					.where(QUsers.name.eq(constant("Phileas")), { replace: true }),
			parameterValues
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE "Users"."name" = $1`,
			parameters: ["Phileas"],
		};
		assert.deepEqual(actual, expected);
	});

	it("supports selecting from a named interface", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const parameters = {
			userId: 1,
		};
		const actual = wrapQuery<{
			userId: number;
		}>((p) => select(querySelect).where(QUsers.id.eq(p.userId)), parameters);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE "Users"."id" = $1`,
			parameters: [1],
		};
		assert.deepEqual(actual, expected);
	});

	it("supports ordering", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const parameters = {};
		const cases = [
			{
				expected: {
					sql: `SELECT "Users"."id" as "id" FROM "Users" ORDER BY "Users"."id" ASC`,
					parameters: [],
				},
				actual: wrapQuery<{}>(
					(p) => select(querySelect).orderBy(QUsers.id.asc()),
					parameters
				),
			},
			{
				expected: {
					sql: `SELECT "Users"."id" as "id" FROM "Users" ORDER BY "Users"."id" DESC`,
					parameters: [],
				},
				actual: wrapQuery<{}>(
					(p) => select(querySelect).orderBy(QUsers.id.desc()),
					parameters
				),
			},
		];
		cases.forEach((entry) => {
			assert.deepEqual(entry.actual, entry.expected);
		});
	});

	it("supports ordering by an aliased expression", function () {
		const nameExpr = lower(col(QUsers.name));

		const querySelect = {
			userName: selectExpression(nameExpr),
		};

		// TODO: don't require manually constructing an OrderByExpressionNode to "orderBy"
		// TODO: expose the expression alias, and use it in the generated "ORDER BY" statement
		const actual = wrapQuery(
			() =>
				select(querySelect).orderBy({
					type: "orderByExpressionNode",
					expression: nameExpr,
				}), // TODO: better API for this
			{}
		).sql;
		const expected = `SELECT lower("Users"."name") as "userName" FROM "Users" ORDER BY lower("Users"."name")`;
		assert.equal(actual, expected);
	});

	it("supports selecting and where clause from multiple tables", function () {
		const querySelect = {
			id: QUsers.id,

			locationId: QLocations.id,
		};

		const actual = select(querySelect)
			.where(QLocations.id.eq(QUsers.locationId))
			.finalise({})
			.toSql({}).sql;
		const expected = `SELECT "Users"."id" as "id", "Locations"."id" as "locationId" FROM "Users", "Locations" WHERE "Locations"."id" = "Users"."locationId"`;
		assert.equal(actual, expected);
	});

	it("supports nested select objects", function () {
		const querySelectNested = {
			id: QUsers.id,
		};

		const querySelect = {
			id: QLocations.id,
			users: selectNestedMany(querySelectNested),
		};

		// TODO: specify the type of join for nested items
		const actual = select(querySelect).finalise({}).toSql({}).sql;
		const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "users.id" FROM "Locations", "Users"`;
		assert.equal(actual, expected);
	});

	it("supports deeply nested select objects", function () {
		const querySelectNestedNested = {
			id: QUsers.id,
		};

		const querySelectNested = {
			id: QLocations.id,
			users: selectNestedMany(querySelectNestedNested),
		};

		const querySelect = {
			id: QAgencies.id,

			locations: selectNestedMany(querySelectNested),
		};

		const actual = select(querySelect).finalise({}).toSql({}).sql;
		const expected = `SELECT "Agencies"."id" as "id", "Locations"."id" as "locations.id", "Users"."id" as "locations.users.id" FROM "Agencies", "Locations", "Users"`;
		assert.equal(actual, expected);
	});

	it("supports function expressions as select output", function () {
		const querySelect = {
			count: selectExpression(count()),
		};

		const actual = select(querySelect)
			.from(QUsers, QLocations)
			.finalise({})
			.toSql({}).sql;
		const expected = `SELECT count(*) as "count" FROM "Users", "Locations"`;
		assert.equal(actual, expected);
	});

	it("supports distinct rows", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const actual = select(querySelect).distinct().finalise({}).toSql({}).sql;
		const expected = `SELECT DISTINCT "Users"."id" as "id" FROM "Users"`;
		assert.equal(actual, expected);
	});

	it("supports limit and offset", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const actual = wrapQuery<{ limit: number; offset: number }>(
			(p) => select(querySelect).limit(p.limit, p.offset),
			{
				limit: 10,
				offset: 20,
			}
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" LIMIT $1 OFFSET $2`,
			parameters: [10, 20],
		};
		assert.deepEqual(actual, expected);
	});

	describe("Joins", function () {
		const querySelect = {
			id: QLocations.id,
			userId: QUsers.id,
		};

		// TODO: see if we can fix the generated alias ordering. Although, does it matter?

		it("can perform an inner join", function () {
			const actual = select(querySelect)
				.from(
					innerJoin(QLocations, QUsers).on(QUsers.locationId.eq(QLocations.id))
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" INNER JOIN "Users" ON "Users"."locationId" = "Locations"."id"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform multiple inner joins", function () {
			const actual = select(querySelect)
				.from(
					innerJoin(QLocations, QUsers)
						.on(QUsers.locationId.eq(QLocations.id))
						.innerJoin(QAgencies)
						.on(QAgencies.id.eq(QLocations.agencyId))
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" INNER JOIN "Users" ON "Users"."locationId" = "Locations"."id" INNER JOIN "Agencies" ON "Agencies"."id" = "Locations"."agencyId"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform inner join with 'USING'", function () {
			const actual = select({
				parentName: QParent.name,
				childName: QChild.name,
				otherChildName: QOtherChild.name,
			})
				.from(
					QParent.$table
						.innerJoin(QChild)
						.using(QChild.parentId)
						.innerJoin(QOtherChild)
						.using(QOtherChild.parentId)
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Parent"."name" as "parentName", "Child"."name" as "childName", "OtherChild"."name" as "otherChildName" FROM "Parent" INNER JOIN "Child" USING ("parentId") INNER JOIN "OtherChild" USING ("parentId")`;
			assert.deepEqual(actual, expected);
		});

		it("can perform a left outer join", function () {
			const actual = select(querySelect)
				.from(
					QLocations.$table
						.leftJoin(QUsers)
						.on(QUsers.locationId.eq(QLocations.id))
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" LEFT OUTER JOIN "Users" ON "Users"."locationId" = "Locations"."id"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform a right outer join", function () {
			const actual = select(querySelect)
				.from(
					QLocations.$table
						.rightJoin(QUsers)
						.on(QUsers.locationId.eq(QLocations.id))
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" RIGHT OUTER JOIN "Users" ON "Users"."locationId" = "Locations"."id"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform a full outer join", function () {
			const actual = select(querySelect)
				.from(
					QLocations.$table
						.fullJoin(QUsers)
						.on(QUsers.locationId.eq(QLocations.id))
				)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" FULL OUTER JOIN "Users" ON "Users"."locationId" = "Locations"."id"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform a left outer join with 'using'", function () {
			const actual = select(querySelect)
				.from(QLocations.$table.leftJoin(QUsers).using(QLocations.id))
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" LEFT OUTER JOIN "Users" USING ("id")`;
			assert.deepEqual(actual, expected);
		});

		it("can perform a cross join", function () {
			const actual = select(querySelect)
				.from(QLocations.$table.crossJoin(QUsers))
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Locations"."id" as "id", "Users"."id" as "userId" FROM "Locations" CROSS JOIN "Users"`;
			assert.deepEqual(actual, expected);
		});

		it("can perform multiple pre-defined joins", function () {
			const joins = [
				innerJoin(QParent, QChild)
					.using(QChild.parentId)
					.innerJoin(QOtherChild)
					.using(QOtherChild.parentId),
			];

			const actual = select({
				parentName: QParent.name,
				childName: QChild.name,
				otherChildName: QOtherChild.name,
			})
				.from(joins)
				.finalise({})
				.toSql({}).sql;
			const expected = `SELECT "Parent"."name" as "parentName", "Child"."name" as "childName", "OtherChild"."name" as "otherChildName" FROM "Parent" INNER JOIN "Child" USING ("parentId") INNER JOIN "OtherChild" USING ("parentId")`;
			assert.deepEqual(actual, expected);
		});
	});

	describe("Boolean Binary Operations", function () {
		const querySelect = {
			id: QLocations.id,
		};

		it("can test for equality", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.eq(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" = $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for unequality", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.neq(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" != $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for greater than", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.gt(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" > $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for greater than or equal", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.gte(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" >= $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for less than", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.lt(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" < $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for less than or equal", function () {
			const actual = wrapQuery<{ locationId: number }>(
				(p) => select(querySelect).where(QLocations.id.lte(p.locationId)),
				{
					locationId: 123,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" <= $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for distinct from", function () {
			const actual = wrapQuery(
				() =>
					select(querySelect).where(
						QLocations.id.isDistinctFrom(QUsers.locationId)
					),
				{}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations", "Users" WHERE "Locations"."id" IS DISTINCT FROM "Users"."locationId"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for not distinct from", function () {
			const actual = wrapQuery(
				() =>
					select(querySelect).where(
						QLocations.id.isNotDistinctFrom(QUsers.locationId)
					),
				{}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations", "Users" WHERE "Locations"."id" IS NOT DISTINCT FROM "Users"."locationId"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for in", function () {
			const actual = wrapQuery<{ agencyId: number }>(
				(p) =>
					select(querySelect).where(
						QLocations.id.in(
							subSelect(QLocations.id)
								.where(QLocations.agencyId.eq(p.agencyId))
								.toNode()
						)
					),
				{
					agencyId: 321,
				}
			);
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IN (SELECT "Locations"."id" FROM "Locations" WHERE "Locations"."agencyId" = $1)`,
				parameters: [321],
			};
			assert.deepEqual(actual, expected);
		});
	});

	describe("Boolean Unary Operations", function () {
		const querySelect = {
			id: QLocations.id,
		};

		it("can test for null", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isNull())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS NULL`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for not null", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isNotNull())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS NOT NULL`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for true", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isTrue())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS TRUE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for not true", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isNotTrue())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS NOT TRUE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for false", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isFalse())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS FALSE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for not false", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isNotFalse())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS NOT FALSE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for unknown", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isUnknown())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS UNKNOWN`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can test for not unknown", function () {
			const actual = select(querySelect)
				.where(QLocations.id.isNotUnknown())
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Locations"."id" as "id" FROM "Locations" WHERE "Locations"."id" IS NOT UNKNOWN`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});
	});

	describe("Boolean Expression Groups", function () {
		const querySelect = {
			id: QUsers.id,

			name: QUsers.name,
		};

		it("can group with 'and'", function () {
			const actual = select(querySelect)
				.where(and(QUsers.id.isNotUnknown(), QUsers.name.isNotNull()))
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Users"."id" as "id", "Users"."name" as "name" FROM "Users" WHERE ("Users"."id" IS NOT UNKNOWN AND "Users"."name" IS NOT NULL)`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("can group with 'or'", function () {
			const actual = select(querySelect)
				.where(or(QUsers.id.isNotUnknown(), QUsers.name.isNotNull()))
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "Users"."id" as "id", "Users"."name" as "name" FROM "Users" WHERE ("Users"."id" IS NOT UNKNOWN OR "Users"."name" IS NOT NULL)`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});
	});

	it("can negate a boolean expression", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const actual = wrapQuery(
			(p) => select(querySelect).where(not(QUsers.id.eq(p.userId))),
			{
				userId: 123,
			}
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE NOT ("Users"."id" = $1)`,
			parameters: [123],
		};
		assert.deepEqual(actual, expected);
	});

	it("can negate an 'exists' sub-query", function () {
		const querySelect = {
			id: QUsers.id,
		};

		const actual = wrapQuery(
			(p) =>
				select(querySelect).where(
					not(
						exists(
							subSelect(constant(1))
								.from(QUsers)
								.where(QUsers.id.eq(p.userId))
								.toNode()
						)
					)
				),
			{
				userId: 123,
			}
		);
		const expected = {
			sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE NOT (EXISTS (SELECT $1 FROM "Users" WHERE "Users"."id" = $2))`,
			parameters: [1, 123],
		};
		assert.deepEqual(actual, expected);
	});

	it(`can use convenience function for exists queries`, function () {
		// Setup
		const query = withParams<{ locationId: number }>()((p) =>
			selectExists((q) =>
				q
					.from(QUsers)
					.where(
						and(
							QLocations.id.eq(QUsers.locationId),
							QLocations.id.eq(p.locationId)
						)
					)
			).finalise(p)
		);

		// Execute
		const actual = query.toSql({
			locationId: 123,
		});

		// Verify
		const expected = {
			parameters: [1, 123],
			sql: `SELECT EXISTS (SELECT $1 FROM "Users", "Locations" WHERE ("Locations"."id" = "Users"."locationId" AND "Locations"."id" = $2)) as "exists"`,
		};
		assert.deepEqual(actual, expected);
	});

	describe("sub-queries", function () {
		it("can include a basic sub-query", function () {
			const querySelect = {
				id: QUsers.id,
			};

			const actual = wrapQuery(
				(p) =>
					select(querySelect).where(
						QUsers.locationId.eq(
							subSelect(QLocations.id)
								.where(QLocations.agencyId.eq(p.agencyId))
								.toNode()
						)
					),
				{
					agencyId: 123,
				}
			);
			// NOTE: generated aliases are back-to-front, since the deepest tables are aliased first.
			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" WHERE "Users"."locationId" = (SELECT "Locations"."id" FROM "Locations" WHERE "Locations"."agencyId" = $1)`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it("sub-queries can reference aliased columns from the outer table, same table", function () {
			const QOuterLocations = deepFreeze(new TLocations("outerLocations"));
			const querySelect = {
				id: QOuterLocations.id,
			};

			const actual = select(querySelect)
				.from(QOuterLocations)
				.where(
					QOuterLocations.id.in(
						subSelect(QLocations.id)
							.where(QLocations.agencyId.eq(QOuterLocations.agencyId))
							.toNode()
					)
				)
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "outerLocations"."id" as "id" FROM "Locations" as "outerLocations" WHERE "outerLocations"."id" IN (SELECT "Locations"."id" FROM "Locations" WHERE "Locations"."agencyId" = "outerLocations"."agencyId")`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it("sub-queries can reference aliased columns from the outer table, different table", function () {
			const QOuterLocations = deepFreeze(new TLocations("outerLocations"));
			const querySelect = {
				id: QOuterLocations.id,
			};

			const actual = select(querySelect)
				.from(QOuterLocations)
				.where(
					QOuterLocations.agencyId.in(
						subSelect(QAgencies.id)
							.where(QOuterLocations.agencyId.eq(QAgencies.id))
							.toNode()
					)
				)
				.finalise({})
				.toSql({});
			const expected = {
				sql: `SELECT "outerLocations"."id" as "id" FROM "Locations" as "outerLocations" WHERE "outerLocations"."agencyId" IN (SELECT "Agencies"."id" FROM "Agencies" WHERE "outerLocations"."agencyId" = "Agencies"."id")`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`can use sub-queries in the "from" clause`, function () {
			// Setup
			const locations = new TLocations("locations");
			const amountSubQuery = selectSubQuery("amountSumT", {
				amountSum: selectExpression(sum(QRecurringPayments.amount.col())),
			}).where(QRecurringPayments.locationId.eq(locations.id));

			// Execute
			const actual = select({
				name: locations.name,
				amount: amountSubQuery.toMetamodel().amountSum,
			})
				.from(locations, amountSubQuery)
				.where(locations.id.eq(constant(123)))
				.finalise({})
				.toSql({});

			// Verify
			const expected = {
				sql: `SELECT "locations"."name" as "name", "amountSumT"."amountSum" as "amount" FROM "Locations" as "locations", (SELECT sum("RecurringPayments"."amount") as "amountSum" FROM "RecurringPayments" WHERE "RecurringPayments"."locationId" = "locations"."id") as "amountSumT" WHERE "locations"."id" = $1`,
				parameters: [123],
			};
			assert.deepEqual(actual, expected);
		});

		it(`correctly aliases inferred tables in subselect`, function () {
			// Setup
			const query = withParams()((p) =>
				select({
					exists: selectExpression(
						exists(
							subSelect(constant(1))
								.from(QUsers)
								.where(QLocations.id.eq(QUsers.locationId))
								.toNode()
						)
					),
				}).finalise(p)
			);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				parameters: [1],
				sql: `SELECT EXISTS (SELECT $1 FROM "Users", "Locations" WHERE "Locations"."id" = "Users"."locationId") as "exists"`,
			};
			assert.deepEqual(actual, expected);
		});
	});

	it(`QueryBuilder's public query composition methods are immutable`, function () {
		const querySelect = {
			id: QUsers.id,
		};
		const p = params<{ userId: number }>();

		const builder1 = select(querySelect);
		const builder2 = builder1.where(QUsers.id.eq(p.userId));
		assert.notStrictEqual(
			builder1,
			builder2,
			"where() should create a new QueryBuilder"
		);
		assert.notStrictEqual(
			(builder1 as any).queryAst,
			(builder2 as any).queryAst,
			"immutable methods should deep clone the queryAst property"
		);
		// assert.notStrictEqual((builder1 as any).tableMap, (builder2 as any).tableMap, "immutable methods should deep clone the tableMap property");
		const builder3 = builder2.from(QUsers);
		assert.notStrictEqual(
			builder2,
			builder3,
			"from() should create a new QueryBuilder"
		);
		const builder4 = builder3.distinct();
		assert.notStrictEqual(
			builder3,
			builder4,
			"distinct() should create a new QueryBuilder"
		);
		const builder5 = builder4.distinctOn(col(QUsers.id));
		assert.notStrictEqual(
			builder4,
			builder5,
			"distinctOn() should create a new QueryBuilder"
		);
		const builder6 = builder5.limit(constant(10));
		assert.notStrictEqual(
			builder5,
			builder6,
			"limit() should create a new QueryBuilder"
		);
		const builder7 = builder6.orderBy(QUsers.id.asc());
		assert.notStrictEqual(
			builder6,
			builder7,
			"orderBy() should create a new QueryBuilder"
		);
	});

	xit(`supports "WITH" (CTEs)`, function () {});

	xit(`supports "USING" (multiple FROMs, an alternative to sub-queries)`, function () {});

	xit(`supports cursors`, function () {});

	describe(`Params`, function () {
		it(`can be provided via a convenience proxy`, function () {
			const querySelect = {
				name: QUsers.name,
			};

			interface Params {
				id: number;
			}

			const p = params<Params>();

			const query = select(querySelect).where(QUsers.id.eq(p.id));

			query.finalise(p).toSql({
				id: 123,
			});
		});

		it(`can be provided via withParams`, function () {
			const querySelect = {
				name: QUsers.name,
			};

			const query = withParams<{
				id: number;
			}>()((p) =>
				select(querySelect).where(QUsers.id.eq(p.id)).finalise(p)
			).toSql({
				id: 123,
			});
		});
	});

	describe(`Locking`, function () {
		it(`Supports FOR UPDATE`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("UPDATE"),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR UPDATE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports FOR SHARE`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("SHARE"),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR SHARE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports FOR KEY SHARE`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("KEY SHARE"),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR KEY SHARE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports FOR NO KEY UPDATE`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("NO KEY UPDATE"),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR NO KEY UPDATE`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports OF`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("UPDATE", {
						of: [QUsers, QLocations],
					}),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR UPDATE OF "Users", "Locations"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports NOWAIT`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("UPDATE", {
						wait: "NOWAIT",
					}),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR UPDATE NOWAIT`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports SKIP LOCKED`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					}).for("UPDATE", {
						wait: "SKIP LOCKED",
					}),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR UPDATE SKIP LOCKED`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`Supports multiple lock clauses`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: QUsers.id,
					})
						.for("NO KEY UPDATE", {
							of: [QUsers],
							wait: "SKIP LOCKED",
						})
						.for("KEY SHARE", {
							of: [QLocations],
							wait: "NOWAIT",
						}),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id" as "id" FROM "Users" FOR NO KEY UPDATE OF "Users" SKIP LOCKED FOR KEY SHARE OF "Locations" NOWAIT`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});
	});

	describe(`casts`, () => {
		it(`can cast a value`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: selectExpression(cast(QUsers.id.col(), "TEXT")),
					}),
				{}
			);

			const expected = {
				sql: `SELECT "Users"."id"::TEXT as "id" FROM "Users"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`can wrap a cast expression in parentheses`, () => {
			const actual = wrapQuery(
				() =>
					select({
						id: selectExpression(cast(QUsers.id.col(), "TEXT", true)),
					}),
				{}
			);

			const expected = {
				sql: `SELECT ("Users"."id")::TEXT as "id" FROM "Users"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});
	});
});

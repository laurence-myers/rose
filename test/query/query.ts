import { QAgencies, QLocations, QUsers, TLocations, TUsers, UsersInsertRow } from "../fixtures";
import { lower, upper } from "../../src/query/postgresql/functions/string/sql";
import { count } from "../../src/query/postgresql/functions/aggregate/general";
import { deepFreeze, OptionalNulls } from "../../src/lang";
import { deleteFrom, insert, insertFromObject, select, update, updateFromObject } from "../../src/query/dsl/commands";
import { selectExpression, selectNestedMany, subSelect } from "../../src/query/dsl/select";
import { alias, aliasCol, and, col, constant, not, or, ParamsWrapper } from "../../src/query/dsl/core";
import {
	ColumnMetamodel,
	PartialTableColumns,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand,
	TableMetamodel
} from "../../src/query/metamodel";
import { AsQuerySelector } from "../../src/query";
import assert = require('assert');

describe("Query DSL", function () {
	describe(`SELECT commands`, () => {
		it("supports selecting and where clause from one table, with an immediate value (param)", function () {
			const querySelect = {
				id: QUsers.id
			};

			interface QueryParams {
				userId: number;
			}
			const params = {
				userId: 1
			};
			const actual = select<typeof querySelect, QueryParams>(querySelect).where(QUsers.id.eq((p: QueryParams) => p.userId)).toSql(params);
			const expected = {
				sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" WHERE "t1"."id" = $1`,
				parameters: [1]
			};
			assert.deepEqual(actual, expected);
		});

		it("supports selecting from a named interface", function () {
			interface QuerySelect {
				id: string;
			}

			const querySelect = {
				id: QUsers.id
			};

			interface QueryParams {
				userId: number;
			}
			const params = {
				userId: 1
			};
			const actual = select<AsQuerySelector<QuerySelect>, QueryParams>(querySelect).where(QUsers.id.eq((p: QueryParams) => p.userId)).toSql(params);
			const expected = {
				sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" WHERE "t1"."id" = $1`,
				parameters: [1]
			};
			assert.deepEqual(actual, expected);
		});

		it("supports ordering", function () {
			const querySelect = {
				id: QUsers.id
			};

			interface QueryParams {
				userId: number;
			}
			const params = {
				userId: 1
			};
			const cases = [
				{
					expected: {
						sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" ORDER BY "t1"."id" ASC`,
						parameters: []
					},
					actual: select<typeof querySelect, QueryParams>(querySelect)
						.orderBy(QUsers.id.asc())
						.toSql(params)
				},
				{
					expected: {
						sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" ORDER BY "t1"."id" DESC`,
						parameters: []
					},
					actual: select<typeof querySelect, QueryParams>(querySelect)
						.orderBy(QUsers.id.desc())
						.toSql(params)
				}
			];
			cases.forEach((entry) => {
				assert.deepEqual(entry.actual, entry.expected);
			});
		});

		it('supports ordering by an aliased expression', function () {
			const nameExpr = lower(QUsers.name.toColumnReferenceNode());

			const querySelect = {
				userName: selectExpression(nameExpr)
			};

			// TODO: don't require manually constructing an OrderByExpressionNode to "orderBy"
			// TODO: expose the expression alias, and use it in the generated "ORDER BY" statement
			const actual = select<typeof querySelect, {}>(querySelect)
				.orderBy({
					type: 'orderByExpressionNode',
					expression: nameExpr
				}) // TODO: better API for this
				.toSql({}).sql;
			const expected = `SELECT lower("t1"."name") as "userName" FROM "Users" as "t1" ORDER BY lower("t1"."name")`;
			assert.equal(actual, expected);
		});

		it("supports selecting and where clause from multiple tables", function () {
			const querySelect = {
				id: QUsers.id,

				locationId: QLocations.id,
			};

			const actual = select(querySelect).where(QLocations.id.eq(QUsers.locationId)).toSql({}).sql;
			const expected = `SELECT "t1"."id" as "id", "t2"."id" as "locationId" FROM "Users" as "t1", "Locations" as "t2" WHERE "t2"."id" = "t1"."locationId"`;
			assert.equal(actual, expected);
		});

		it("supports nested select objects", function () {
			const querySelectNested = {
				id: QUsers.id,
			};

			const querySelect = {
				id: QLocations.id,
				users: selectNestedMany(querySelectNested)
			};

			// TODO: specify the type of join for nested items
			const actual = select(querySelect).toSql({}).sql;
			const expected = `SELECT "t1"."id" as "id", "t2"."id" as "users.id" FROM "Locations" as "t1", "Users" as "t2"`;
			assert.equal(actual, expected);
		});

		it("supports deeply nested select objects", function () {
			const querySelectNestedNested = {
				id: QUsers.id,
			};

			const querySelectNested = {
				id: QLocations.id,
				users: selectNestedMany(querySelectNestedNested)
			};

			const querySelect = {
				id: QAgencies.id,

				locations: selectNestedMany(querySelectNested)
			};

			const actual = select(querySelect).toSql({}).sql;
			const expected = `SELECT "t1"."id" as "id", "t2"."id" as "locations.id", "t3"."id" as "locations.users.id" FROM "Agencies" as "t1", "Locations" as "t2", "Users" as "t3"`;
			assert.equal(actual, expected);
		});

		it("supports function expressions as select output", function () {
			const querySelect = {
				count: selectExpression(count())
			};

			const actual = select(querySelect).from(QUsers, QLocations).toSql({}).sql;
			const expected = `SELECT count(*) as "count" FROM "Users" as "t1", "Locations" as "t2"`;
			assert.equal(actual, expected);
		});

		it("supports distinct rows", function () {
			const querySelect = {
				id: QUsers.id,
			};

			const actual = select(querySelect).distinct().toSql({}).sql;
			const expected = `SELECT DISTINCT "t1"."id" as "id" FROM "Users" as "t1"`;
			assert.equal(actual, expected);
		});

		it("supports limit and offset", function () {
			const querySelect = {
				id: QUsers.id,
			};

			const actual = select(querySelect).limit().toSql({
				limit: 10,
				offset: 20
			});
			const expected = {
				sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" LIMIT $1 OFFSET $2`,
				parameters: [10, 20]
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
				const actual = select(querySelect).join(QUsers).on(QUsers.locationId.eq(QLocations.id)).toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" INNER JOIN "Users" as "t1" ON "t1"."locationId" = "t2"."id"`;
				assert.deepEqual(actual, expected);
			});

			it("can perform a left outer join", function () {
				const actual = select(querySelect).join(QUsers).left().on(QUsers.locationId.eq(QLocations.id)).toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" LEFT OUTER JOIN "Users" as "t1" ON "t1"."locationId" = "t2"."id"`;
				assert.deepEqual(actual, expected);
			});

			it("can perform a right outer join", function () {
				const actual = select(querySelect).join(QUsers).right().on(QUsers.locationId.eq(QLocations.id)).toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" RIGHT OUTER JOIN "Users" as "t1" ON "t1"."locationId" = "t2"."id"`;
				assert.deepEqual(actual, expected);
			});

			it("can perform a full outer join", function () {
				const actual = select(querySelect).join(QUsers).full().on(QUsers.locationId.eq(QLocations.id)).toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" FULL OUTER JOIN "Users" as "t1" ON "t1"."locationId" = "t2"."id"`;
				assert.deepEqual(actual, expected);
			});

			it("can perform a left outer join with 'using'", function () {
				const actual = select(querySelect).join(QUsers).left().using(QLocations.id).toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" LEFT OUTER JOIN "Users" as "t1" USING "t2"."id"`;
				assert.deepEqual(actual, expected);
			});

			it("can perform a cross join", function () {
				const actual = select(querySelect).join(QUsers).cross().toSql({}).sql;
				const expected = `SELECT "t2"."id" as "id", "t1"."id" as "userId" FROM "Locations" as "t2" CROSS JOIN "Users" as "t1"`;
				assert.deepEqual(actual, expected);
			});
		});

		describe("Boolean Binary Operations", function () {
			const querySelect = {
				id: QLocations.id,
			};

			it("can test for equality", function () {
				const actual = select(querySelect).where(QLocations.id.eq((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" = $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for unequality", function () {
				const actual = select(querySelect).where(QLocations.id.neq((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" != $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for greater than", function () {
				const actual = select(querySelect).where(QLocations.id.gt((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" > $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for greater than or equal", function () {
				const actual = select(querySelect).where(QLocations.id.gte((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" >= $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for less than", function () {
				const actual = select(querySelect).where(QLocations.id.lt((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" < $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for less than or equal", function () {
				const actual = select(querySelect).where(QLocations.id.lte((params) => params.locationId)).toSql({
					locationId: 123
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" <= $1`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for distinct from", function () {
				const actual = select(querySelect).where(QLocations.id.isDistinctFrom(QUsers.locationId)).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1", "Users" as "t2" WHERE "t1"."id" IS DISTINCT FROM "t2"."locationId"`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for not distinct from", function () {
				const actual = select(querySelect).where(QLocations.id.isNotDistinctFrom(QUsers.locationId)).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1", "Users" as "t2" WHERE "t1"."id" IS NOT DISTINCT FROM "t2"."locationId"`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for in", function () {
				const actual = select(querySelect).where(QLocations.id.in(
					subSelect(QLocations.id)
						.where(QLocations.agencyId.eq((p) => p.agencyId))
						.toSubQuery()
				)).toSql({
					agencyId: 321
				});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IN (SELECT "t1"."id" FROM "Locations" as "t1" WHERE "t1"."agencyId" = $1)`,
					parameters: [321]
				};
				assert.deepEqual(actual, expected);
			});
		});

		describe("Boolean Unary Operations", function () {
			const querySelect = {
				id: QLocations.id,
			};

			it("can test for null", function () {
				const actual = select(querySelect).where(QLocations.id.isNull()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS NULL`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for not null", function () {
				const actual = select(querySelect).where(QLocations.id.isNotNull()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS NOT NULL`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for true", function () {
				const actual = select(querySelect).where(QLocations.id.isTrue()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS TRUE`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for not true", function () {
				const actual = select(querySelect).where(QLocations.id.isNotTrue()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS NOT TRUE`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for false", function () {
				const actual = select(querySelect).where(QLocations.id.isFalse()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS FALSE`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for not false", function () {
				const actual = select(querySelect).where(QLocations.id.isNotFalse()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS NOT FALSE`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for unknown", function () {
				const actual = select(querySelect).where(QLocations.id.isUnknown()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS UNKNOWN`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can test for not unknown", function () {
				const actual = select(querySelect).where(QLocations.id.isNotUnknown()).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id" FROM "Locations" as "t1" WHERE "t1"."id" IS NOT UNKNOWN`,
					parameters: []
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
				const actual = select(querySelect).where(
					and(
						QUsers.id.isNotUnknown(),
						QUsers.name.isNotNull()
					)
				).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id", "t1"."name" as "name" FROM "Users" as "t1" WHERE ("t1"."id" IS NOT UNKNOWN AND "t1"."name" IS NOT NULL)`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});

			it("can group with 'or'", function () {
				const actual = select(querySelect).where(
					or(
						QUsers.id.isNotUnknown(),
						QUsers.name.isNotNull()
					)
				).toSql({});
				const expected = {
					sql: `SELECT "t1"."id" as "id", "t1"."name" as "name" FROM "Users" as "t1" WHERE ("t1"."id" IS NOT UNKNOWN OR "t1"."name" IS NOT NULL)`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});
		});

		it("can negate a boolean expression", function () {
			const querySelect = {
				id: QUsers.id,
			};

			const actual = select(querySelect).where(
				not(QUsers.id.eq((p) => p.userId)),
			).toSql({
				userId: 123
			});
			const expected = {
				sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" WHERE NOT ("t1"."id" = $1)`,
				parameters: [123]
			};
			assert.deepEqual(actual, expected);
		});

		describe("sub-queries", function () {
			it("can include a basic sub-query", function () {
				const querySelect = {
					id: QUsers.id,
				};

				const actual = select(querySelect).where(
					QUsers.locationId.eq(
						subSelect(
							QLocations.id
						).where(QLocations.agencyId.eq((p) => p.agencyId))
							.toSubQuery()
					),
				).toSql({
					agencyId: 123
				});
				// NOTE: generated aliases are back-to-front, since the deepest tables are aliased first.
				const expected = {
					sql: `SELECT "t2"."id" as "id" FROM "Users" as "t2" WHERE "t2"."locationId" = (SELECT "t1"."id" FROM "Locations" as "t1" WHERE "t1"."agencyId" = $1)`,
					parameters: [123]
				};
				assert.deepEqual(actual, expected);
			});

			it("sub-queries can reference aliased columns from the outer table", function () {
				const QOuterLocations = deepFreeze(new TLocations("outerLocations"));
				const querySelect = {
					id: QOuterLocations.id,
				};

				const actual = select(querySelect)
					.from(QOuterLocations)
					.where(QOuterLocations.id.in(
						subSelect(QLocations.id)
							.where(QLocations.agencyId.eq(QOuterLocations.agencyId))
							.toSubQuery()
					)).toSql({});
				const expected = {
					sql: `SELECT "outerLocations"."id" as "id" FROM "Locations" as "outerLocations" WHERE "outerLocations"."id" IN (SELECT "t1"."id" FROM "Locations" as "t1" WHERE "t1"."agencyId" = "outerLocations"."agencyId")`,
					parameters: []
				};
				assert.deepEqual(actual, expected);
			});
		});

		it(`QueryBuilder's public query composition methods are immutable`, function () {
			const querySelect = {
				id: QUsers.id,
			};

			const builder1 = select(querySelect);
			const builder2 = builder1.where(QUsers.id.eq((p) => p.userId));
			assert.notStrictEqual(builder1, builder2, "where() should create a new QueryBuilder");
			assert.notStrictEqual((builder1 as any).queryAst, (builder2 as any).queryAst, "immutable methods should deep clone the queryAst property");
			// assert.notStrictEqual((builder1 as any).tableMap, (builder2 as any).tableMap, "immutable methods should deep clone the tableMap property");
			const builder3 = builder2.from(QUsers);
			assert.notStrictEqual(builder2, builder3, "from() should create a new QueryBuilder");
			assert.ok((builder3 as any).tableMap.size > 0, "from() should populate the tableMap");
			const builder4 = builder3.join(QUsers).cross();
			assert.notStrictEqual(builder3, builder4, "join() should create a new QueryBuilder");
			// assert.ok((builder4 as any).tableMap.size > 0, "join() should populate the tableMap");
			const builder5 = builder4.distinct();
			assert.notStrictEqual(builder4, builder5, "distinct() should create a new QueryBuilder");
			const builder6 = builder5.distinctOn(col(QUsers.id));
			assert.notStrictEqual(builder5, builder6, "distinctOn() should create a new QueryBuilder");
			const builder7 = builder6.limit();
			assert.notStrictEqual(builder6, builder7, "limit() should create a new QueryBuilder");
			const builder8 = builder7.orderBy(QUsers.id.asc());
			assert.notStrictEqual(builder7, builder8, "orderBy() should create a new QueryBuilder");
		});

		xit(`supports "WITH" (CTEs)`, function () {});

		xit(`supports "USING" (multiple FROMs, an alternative to sub-queries)`, function () {});

		xit(`supports cursors`, function () {});
	});

	describe(`DELETE commands`, () => {
		it(`supports deleting from a table with constant criteria`, function () {
			// Set up
			const query = deleteFrom(QUsers)
				.where(QUsers.id.eq(constant(123)));

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `DELETE FROM "Users" as "t1" WHERE "t1"."id" = $1`,
				parameters: [
					123
				]
			};
			assert.deepEqual(actual, expected);
		});

		xit(`supports returning a selection`, function () {});
	});

	describe(`UPDATE commands`, function () {
		it(`supports updating a table with simple values`, function () {
			// Set up
			interface Params {
				name: string;
			}
			const paramsWrapper = new ParamsWrapper<Params>();
			const query = update<TUsers, Params>(QUsers)
				.set({
					name: upper(paramsWrapper.get((p) => p.name))
				})
				.where(QUsers.id.eq(constant(123)));

			// Execute
			const actual = query.toSql({
				name: 'fred'
			});

			// Verify
			const expected = {
				sql: `UPDATE "Users" as "t1" SET "name" = upper($1) WHERE "t1"."id" = $2`,
				parameters: ['fred', 123]
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports dynamically generating "set" criteria from an entity-like object`, function () {
			// Set up
			interface Params {
				id: TableColumns<TUsers>['id'];
			}

			const now = new Date('2020-04-01T14:30:00Z');

			const updates: PartialTableColumns<TUsers> = {
				deletedAt: now,
				name: 'fred'
			};
			const paramsWrapper = new ParamsWrapper<Params>();

			const query = updateFromObject<TUsers, Params>(QUsers, updates)
				.where(QUsers.id.eq(paramsWrapper.get((p) => p.id)));

			// Execute
			const actual = query.toSql({
				id: 123,
				...updates
			});

			// Verify
			const expected = {
				sql: `UPDATE "Users" as "t1" SET "deletedAt" = $1, "name" = $2 WHERE "t1"."id" = $3`,
				parameters: [now, 'fred', 123]
			};
			assert.deepEqual(actual, expected);
		});
	});

	describe(`INSERT commands`, () => {
		it(`supports inserting a single row`, function () {
			// Set up
			interface Params extends TableColumns<TUsers> {

			}

			interface InsertRow extends TableColumnsForUpdateCommand<TUsers> {

			}
			const paramsWrapper = new ParamsWrapper<Params>();
			const query = insert<TUsers, InsertRow, Params>(QUsers)
				.insert({
					// NOTE: for this test, property names should not be in alphabetical order, to verify that
					// `insert()` explicitly sorts them.
					id: paramsWrapper.get((p) => p.id),
					name: paramsWrapper.get((p) => p.name),
					deletedAt: paramsWrapper.get((p) => p.deletedAt),
					locationId: paramsWrapper.get((p) => p.locationId)
				});

			// Execute
			const actual = query.toSql({
				id: 123,
				name: 'Fred',
				deletedAt: null,
				locationId: 456
			});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("deletedAt", "id", "locationId", "name") VALUES ($1, $2, $3, $4)`,
				parameters: [null, 123, 456, 'Fred'] // In order of column name (sorted alphabetically)
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting a single row where casing differs between the object and the columns`, function () {
			// Set up
			class TUsers extends QueryTable {
				constructor($tableAlias? : string) { super(new TableMetamodel("Users", $tableAlias)); }

				id = new ColumnMetamodel<number>(this.$table, "id");
				locationId = new ColumnMetamodel<number>(this.$table, "location_id");
				name = new ColumnMetamodel<string>(this.$table, "name");
				deletedAt = new ColumnMetamodel<Date | null>(this.$table, "deleted_at");
			}
			const QUsers = deepFreeze(new TUsers());

			interface Params extends TableColumns<TUsers> {

			}

			interface InsertRow extends TableColumnsForUpdateCommand<TUsers> {

			}
			const paramsWrapper = new ParamsWrapper<Params>();
			const query = insert<TUsers, InsertRow, Params>(QUsers)
				.insert({
					id: paramsWrapper.get((p) => p.id),
					name: paramsWrapper.get((p) => p.name),
					deletedAt: paramsWrapper.get((p) => p.deletedAt),
					locationId: paramsWrapper.get((p) => p.locationId)
				});

			// Execute
			const actual = query.toSql({
				id: 123,
				name: 'Fred',
				deletedAt: null,
				locationId: 456
			});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("deleted_at", "id", "location_id", "name") VALUES ($1, $2, $3, $4)`,
				parameters: [null, 123, 456, 'Fred'] // In order of column name (sorted alphabetically)
			};
			assert.deepEqual(actual, expected);
		});

		it(`can omit nullable fields`, function () {
			// Set up
			interface Params extends OptionalNulls<TableColumns<TUsers>> {

			}

			interface InsertRow extends TableColumnsForInsertCommand<TUsers> {
			}

			const paramsWrapper = new ParamsWrapper<Params>();
			const insertRow: InsertRow = {
				id: paramsWrapper.get((p) => p.id),
				name: paramsWrapper.get((p) => p.name),
				locationId: paramsWrapper.get((p) => p.locationId),
			};

			const query = insert<TUsers, InsertRow, Params>(QUsers)
				.insert(insertRow);

			// Execute
			const actual = query.toSql({
				id: 123,
				name: 'Fred',
				locationId: 456
			});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES ($1, $2, $3)`,
				parameters: [123, 456, 'Fred'] // In order of column name (sorted alphabetically)
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports dynamically generating inserted values from an entity-like object`, function () {
			// Set up
			interface Params {

			}

			interface InsertRow extends UsersInsertRow {
			}

			const insertRow: InsertRow = {
				id: 123,
				name: 'Fred',
				locationId: 456,
			};

			const query = insertFromObject<TUsers, InsertRow, Params>(QUsers, insertRow);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES ($1, $2, $3)`,
				parameters: [123, 456, 'Fred'] // In order of column name (sorted alphabetically)
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting from a sub-query, using alias to specify column name`, function () {
			// Set up
			const query = insert(QUsers)
				.insertFromQuery(
					subSelect(
						alias(col(QLocations.id), 'locationId')
					).where(QLocations.name.eq(constant('Launceston')))
						.toSubQuery(),
					[]
				);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" (SELECT "t2"."id" as "locationId" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
				parameters: ['Launceston']
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting from a sub-query, using columns argument`, function () {
			// Set up
			const query = insert(QUsers)
				.insertFromQuery(
					subSelect(
						QLocations.id
					).where(QLocations.name.eq(constant('Launceston')))
						.toSubQuery(),
					[
						'locationId'
					]
				);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("locationId") (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
				parameters: ['Launceston']
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting from a sub-query, inferring the (wrongly named) columns`, function () {
			// Set up
			const query = insert(QUsers)
				.insertFromQuery(
					subSelect(
						QLocations.id
					).where(QLocations.name.eq(constant('Launceston')))
						.toSubQuery()
				);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("id") (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
				parameters: ['Launceston']
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting from a sub-query, inferring the (aliased) columns`, function () {
			// Set up
			const query = insert(QUsers)
				.insertFromQuery(
					subSelect(
						aliasCol(QLocations.id, 'locationId')
					).where(QLocations.name.eq(constant('Launceston')))
						.toSubQuery()
				);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" ("locationId") (SELECT "t2"."id" as "locationId" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
				parameters: ['Launceston']
			};
			assert.deepEqual(actual, expected);
		});

		it(`supports inserting from a sub-query, without specifying columns`, function () {
			// Set up
			const query = insert(QUsers)
				.insertFromQuery(
					subSelect(
						QLocations.id
					).where(QLocations.name.eq(constant('Launceston')))
						.toSubQuery(),
					[] // no column names
				);

			// Execute
			const actual = query.toSql({});

			// Verify
			const expected = {
				sql: `INSERT INTO "Users" as "t1" (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
				parameters: ['Launceston']
			};
			assert.deepEqual(actual, expected);
		});
	});
});

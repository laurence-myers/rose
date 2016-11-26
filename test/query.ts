// import {describe, it} from "mocha";
import {NumericColumnMetamodel, TableMetamodel, Table, Column} from "../src/query/metamodel";
import {select, Nested, Expression} from "../src/query/dsl";
import assert = require('assert');
import {count} from "../src/query/postgresql/functions";

describe("Query DSL", function () {
	@Table(new TableMetamodel("Users"))
	class QUsers {
		static id = new NumericColumnMetamodel(QUsers, "id", Number);
		static locationId = new NumericColumnMetamodel(QUsers, "locationId", Number);

		protected constructor() {}
	}

	@Table(new TableMetamodel("Locations"))
	class QLocations {
		static id = new NumericColumnMetamodel(QLocations, "id", Number);
		static agencyId = new NumericColumnMetamodel(QLocations, "id", Number);

		protected constructor() {}
	}

	@Table(new TableMetamodel("Agencies"))
	class QAgencies {
		static id = new NumericColumnMetamodel(QAgencies, "id", Number);

		protected constructor() {}
	}

	it("supports selecting and where clause from one table, with an immediate value (param)", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}

		interface QueryParams {
			userId : number;
		}
		const params = {
			userId : 1
		};
		const actual = select<any, QueryParams>(QuerySelect).where(QUsers.id.eq((p : QueryParams) => p.userId)).toSql(params);
		const expected = {
			sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" WHERE ("t1"."id" = $1)`,
			parameters: [1]
		};
		assert.deepEqual(actual, expected);
	});

	it("supports ordering", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}

		interface QueryParams {
			userId : number;
		}
		const params = {
			userId : 1
		};
		const cases = [
			{
				expected: {
					sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" ORDER BY "t1"."id" ASC`,
					parameters: []
				},
				actual: select<any, QueryParams>(QuerySelect)
					.orderBy(QUsers.id.asc())
					.toSql(params)
			},
			{
				expected: {
					sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" ORDER BY "t1"."id" DESC`,
					parameters: []
				},
				actual: select<any, QueryParams>(QuerySelect)
					.orderBy(QUsers.id.desc())
					.toSql(params)
			}
		];
		cases.forEach((entry) => {
			assert.deepEqual(entry.actual, entry.expected);
		});
	});

	it("supports selecting and where clause from multiple tables", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;

			@Column(QLocations.id)
			locationId : number;
		}

		const actual = select(QuerySelect).where(QLocations.id.eq(QUsers.locationId)).toSql({}).sql;
		const expected = `SELECT "t1"."id" as "id", "t2"."id" as "locationId" FROM "Users" as "t1", "Locations" as "t2" WHERE ("t2"."id" = "t1"."locationId")`;
		assert.equal(actual, expected);
	});

	it("supports nested select objects", function () {
		class QuerySelectNested {
			@Column(QUsers.id)
			id : number;
		}

		class QuerySelect {
			@Column(QLocations.id)
			id : number;

			@Nested(QuerySelectNested)
			users : Array<QuerySelectNested>;
		}

		const actual = select(QuerySelect).toSql({}).sql;
		const expected = `SELECT "t1"."id" as "id", "t2"."id" as "users.id" FROM "Locations" as "t1", "Users" as "t2"`;
		assert.equal(actual, expected);
	});

	it("supports deeply nested select objects", function () {
		class QuerySelectNestedNested {
			@Column(QUsers.id)
			id : number;
		}

		class QuerySelectNested {
			@Column(QLocations.id)
			id : number;

			@Nested(QuerySelectNestedNested)
			users : Array<QuerySelectNestedNested>;
		}

		class QuerySelect {
			@Column(QAgencies.id)
			id : number;

			@Nested(QuerySelectNested)
			locations : Array<QuerySelectNested>;
		}

		const actual = select(QuerySelect).toSql({}).sql;
		const expected = `SELECT "t1"."id" as "id", "t2"."id" as "locations.id", "t3"."id" as "users.id" FROM "Agencies" as "t1", "Locations" as "t2", "Users" as "t3"`;
		assert.equal(actual, expected);
	});

	it("supports function expressions as select output", function () {
		class QuerySelect {
			@Expression(count())
			count : number;
		}

		const actual = select(QuerySelect).from(QUsers, QLocations).toSql({}).sql;
		const expected = `SELECT count(*) FROM "Users" as "t1", "Locations" as "t2"`; // TODO: the count should be output with an alias of "count"
		assert.equal(actual, expected);
	});
});
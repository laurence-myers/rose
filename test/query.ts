// import {describe, it} from "mocha";
import {
	NumericColumnMetamodel, TableMetamodel, Table, Column, StringColumnMetamodel,
	QueryTable
} from "../src/query/metamodel";
import {select, Nested, Expression} from "../src/query/dsl";
import assert = require('assert');
import {count} from "../src/query/postgresql/functions";
import {deepFreeze} from "../src/lang";

describe("Query DSL", function () {
	class TUsers implements QueryTable {
		$table = new TableMetamodel("Users");

		id = new NumericColumnMetamodel(this.$table, "id", Number);
		locationId = new NumericColumnMetamodel(this.$table, "locationId", Number);
		name = new StringColumnMetamodel(this.$table, "name", String);
	}
	const QUsers = deepFreeze(new TUsers());

	class TLocations implements QueryTable {
		$table = new TableMetamodel("Locations");

		id = new NumericColumnMetamodel(this.$table, "id", Number);
		agencyId = new NumericColumnMetamodel(this.$table, "id", Number);
	}
	const QLocations = deepFreeze(new TLocations());

	class TAgencies implements QueryTable {
		$table = new TableMetamodel("Agencies");

		id = new NumericColumnMetamodel(this.$table, "id", Number);
	}
	const QAgencies = deepFreeze(new TAgencies());

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
		const expected = `SELECT count(*) as "count" FROM "Users" as "t1", "Locations" as "t2"`;
		assert.equal(actual, expected);
	});

	it("supports distinct rows", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}

		const actual = select(QuerySelect).distinct().toSql({}).sql;
		const expected = `SELECT DISTINCT "t1"."id" as "id" FROM "Users" as "t1"`;
		assert.equal(actual, expected);
	});

	it("supports limit and offset", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}

		const actual = select(QuerySelect).limit().toSql({
			limit: 10,
			offset: 20
		});
		const expected = {
			sql: `SELECT "t1"."id" as "id" FROM "Users" as "t1" LIMIT $1 OFFSET $2`,
			parameters: [10, 20]
		};
		assert.deepEqual(actual, expected);
	});
});
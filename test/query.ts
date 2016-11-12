// import {describe, it} from "mocha";
import {NumericColumnMetamodel, TableMetamodel, Table, Column} from "../src/query/metamodel";
import {select, Nested} from "../src/query/dsl";
import assert = require('assert');

describe("Query DSL", function () {
	it("supports selecting and where clause from one table, with an immediate value (param)", function () {
		@Table(new TableMetamodel("Users"))
		class QUsers {
			static id = new NumericColumnMetamodel(QUsers, "id", Number);
			static locationId = new NumericColumnMetamodel(QUsers, "id", Number);

			protected constructor() {}
		}

		@Table(new TableMetamodel("Locations"))
		class QLocations {
			static id = new NumericColumnMetamodel(QLocations, "id", Number);

			protected constructor() {}
		}

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

	it("supports selecting and where clause from multiple tables", function () {
		@Table(new TableMetamodel("Users"))
		class QUsers {
			static id = new NumericColumnMetamodel(QUsers, "id", Number);
			static locationId = new NumericColumnMetamodel(QUsers, "locationId", Number);

			protected constructor() {}
		}

		@Table(new TableMetamodel("Locations"))
		class QLocations {
			static id = new NumericColumnMetamodel(QLocations, "id", Number);

			protected constructor() {}
		}

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
		@Table(new TableMetamodel("Users"))
		class QUsers {
			static id = new NumericColumnMetamodel(QUsers, "id", Number);
			static locationId = new NumericColumnMetamodel(QUsers, "locationId", Number);

			protected constructor() {}
		}

		@Table(new TableMetamodel("Locations"))
		class QLocations {
			static id = new NumericColumnMetamodel(QLocations, "id", Number);

			protected constructor() {}
		}

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
});
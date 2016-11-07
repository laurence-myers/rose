// import {describe, it} from "mocha";
import {NumericColumnMetamodel, TableMetamodel, Table, Column} from "../src/query/metamodel";
import {select} from "../src/query/dsl";

describe("Query DSL", function () {
	it("produces SQL", function () {
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

		const result = select(QuerySelect).where(QUsers.id.eq(1));
		console.log(result.toSql());
	});
});
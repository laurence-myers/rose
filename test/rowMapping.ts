import assert = require('assert');
import {QLocations, QUsers} from "./fixtures";
import {Column} from "../src/query/metamodel";
import {mapRowToClass} from "../src/rowMapping/rowMapping";
import {Nested} from "../src/query/dsl";
import {AliasedExpressionNode, ColumnReferenceNode, SelectOutputExpression} from "../src/query/ast";

describe("Row mapping", function () {
	it("Can map a single number column to a data class", function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}
		const outputExpressions : SelectOutputExpression[] = [
			<ColumnReferenceNode> {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1"
			}
		];
		const row = {
			id: 123
		};

		const result = mapRowToClass(QuerySelect, outputExpressions, row);

		assert.strictEqual(result.id, 123);
	});

	it("Can map a single string column to a data class, with the property name a different name to the column", function () {
		class QuerySelect {
			@Column(QUsers.name)
			userName: string;
		}
		const outputExpressions : SelectOutputExpression[] = [
			<AliasedExpressionNode> {
				type: "aliasedExpressionNode",
				alias: "userName",
				expression: <ColumnReferenceNode> {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "name",
					tableAlias: "t1"
				}
			},
		];
		const row = {
			userName: "Phileas Fogg"
		};

		const result = mapRowToClass(QuerySelect, outputExpressions, row);

		assert.equal(result.userName, "Phileas Fogg");
	});

	xit("Can map a nested sub-query", function () {
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

		// TODO: map nested rows to a single outer object
		const row = {
			id: 123,
			"users.id": 456
		};

		const result = mapRowToClass(QuerySelect, [], row);

		assert.equal(result.id, 123);
		assert.equal(result.users[0].id, 456);
	});
});
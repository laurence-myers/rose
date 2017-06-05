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

	it("Can map a nested sub-query", function () {
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

		const outputExpressions : SelectOutputExpression[] = [
			<ColumnReferenceNode> {
					type: "columnReferenceNode",
					tableName: "Locations",
					columnName: "id",
					tableAlias: "t2"
			},
			<AliasedExpressionNode> {
				type: "aliasedExpressionNode",
				alias: "users.id",
				expression: <ColumnReferenceNode> {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
					tableAlias: "t1"
				}
			}
		];
		// TODO: map nested rows to a single outer object
		const row = {
			id: 123,
			"users.id": 456
		};

		const result = mapRowToClass(QuerySelect, outputExpressions, row);

		assert.deepEqual(result, {
			id: 123,
			users: [
				{
					id: 456
				}
			]
		});
	});

	it("Can map a nested sub-query with multiple columns", function () {
		class QuerySelectNested {
			@Column(QUsers.id)
			id : number;

			@Column(QUsers.name)
			userName: string;
		}

		class QuerySelect {
			@Column(QLocations.id)
			id : number;

			@Nested(QuerySelectNested)
			users : Array<QuerySelectNested>;
		}

		const outputExpressions : SelectOutputExpression[] = [
			<ColumnReferenceNode> {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2"
			},
			<AliasedExpressionNode> {
				type: "aliasedExpressionNode",
				alias: "users.id",
				expression: <ColumnReferenceNode> {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
					tableAlias: "t1"
				}
			},
			<AliasedExpressionNode> {
				type: "aliasedExpressionNode",
				alias: "users.userName",
				expression: <ColumnReferenceNode> {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
					tableAlias: "t1"
				}
			}
		];
		// TODO: map nested rows to a single outer object
		const row = {
			id: 123,
			"users.id": 456,
			"users.userName": "Phileas Fogg"
		};

		const result = mapRowToClass(QuerySelect, outputExpressions, row);

		assert.deepEqual(result, {
			id: 123,
			users: [
				{
					id: 456,
					userName: "Phileas Fogg"
				}
			]
		});
	});

	xit("Can map a nested sub-query with multiple rows", function () {

	});

	xit("Can map a deeply nested sub-query", function () {

	});
});
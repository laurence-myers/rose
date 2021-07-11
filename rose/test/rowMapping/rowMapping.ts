import assert = require("assert");
import { QAgencies, QLocations, QUsers } from "../fixtures";
import { mapRowsToClass, mapRowToClass } from "../../src/rowMapping/rowMapping";
import {
	AliasedSelectExpressionNode,
	ConstantNode,
	ParameterOrValueExpressionNode,
	SelectOutputExpression,
} from "../../src/query/ast";
import { RowMappingError, UnsupportedOperationError } from "../../src/errors";
import { count } from "../../src/query/dsl/postgresql/aggregate/general";
import { QueryOutput } from "../../src/query/typeMapping";
import { selectExpression, selectNestedMany } from "../../src/query/dsl/select";
import { constant } from "../../src/query/dsl/core";

function alias(
	aliasPath: string[],
	node: ParameterOrValueExpressionNode
): AliasedSelectExpressionNode {
	return {
		type: "aliasedExpressionNode",
		alias: {
			type: "aliasNode",
			name: aliasPath.join("."),
			path: aliasPath,
		},
		expression: node,
	};
}

describe("Row mapping", function () {
	it("Can map a single number column to a data class", function () {
		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		const row = {
			id: 123,
		};

		const result = mapRowToClass(outputExpressions, row);

		assert.deepStrictEqual(result, {
			id: 123,
		});
	});

	it("Dies attempting to map a non-existing alias", function () {
		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		const row = {
			userId: 123,
		};

		assert.throws(() => mapRowToClass(outputExpressions, row), RowMappingError);
	});

	it("Can map a single string column to a data class, with the property name a different name to the column", function () {
		const querySelect = {
			userName: QUsers.name,
		};
		const outputExpressions: SelectOutputExpression[] = [
			alias(["userName"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "name",
				tableAlias: "t1",
			}),
		];
		const row = {
			userName: "Phileas Fogg",
		};

		const result = mapRowToClass<typeof querySelect>(outputExpressions, row);

		assert.equal(result.userName, "Phileas Fogg");
	});

	it("Can map a nested sub-query", function () {
		const querySelectNested = {
			id: QUsers.id,
		};

		const querySelect = {
			id: QLocations.id,
			users: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		// TODO: map nested rows to a single outer object
		const row = {
			id: 123,
			"users.id": 456,
		};

		const result = mapRowToClass<typeof querySelect>(outputExpressions, row);

		assert.deepEqual(result, {
			id: 123,
			users: [
				{
					id: 456,
				},
			],
		});
	});

	it("Can map a nested sub-query with multiple columns", function () {
		const querySelectNested = {
			id: QUsers.id,

			userName: QUsers.name,
		};

		const querySelect = {
			id: QLocations.id,

			users: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
			alias(["users", "userName"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		// TODO: map nested rows to a single outer object
		const row = {
			id: 123,
			"users.id": 456,
			"users.userName": "Phileas Fogg",
		};

		const result = mapRowToClass<typeof querySelect>(outputExpressions, row);

		assert.deepEqual(result, {
			id: 123,
			users: [
				{
					id: 456,
					userName: "Phileas Fogg",
				},
			],
		});
	});

	it("Can map a deeply nested sub-query", function () {
		const querySelectDeeplyNested = {
			id: QUsers.id,
		};

		const querySelectNested = {
			id: QLocations.id,

			users: selectNestedMany(querySelectDeeplyNested),
		};

		const querySelect = {
			id: QAgencies.id,

			locations: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t3",
			}),
			alias(["locations", "id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["locations", "users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		const row = {
			id: 123,
			"locations.id": 456,
			"locations.users.id": 789,
		};

		const result = mapRowToClass<typeof querySelect>(outputExpressions, row);

		assert.deepEqual(result, {
			id: 123,
			locations: [
				{
					id: 456,
					users: [
						{
							id: 789,
						},
					],
				},
			],
		});
	});

	it("Can map multiple rows with deeply nested sub-queries", function () {
		const querySelectDeeplyNested = {
			id: QUsers.id,
		};

		const querySelectNested = {
			id: QLocations.id,

			users: selectNestedMany(querySelectDeeplyNested),
		};

		const querySelect = {
			id: QAgencies.id,

			locations: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t3",
			}),
			{
				type: "aliasedExpressionNode",
				alias: {
					type: "aliasNode",
					name: "locations.id",
					path: ["locations", "id"],
				},
				expression: {
					type: "columnReferenceNode",
					tableName: "Locations",
					columnName: "id",
					tableAlias: "t2",
				},
			},
			{
				type: "aliasedExpressionNode",
				alias: {
					type: "aliasNode",
					name: "locations.users.id",
					path: ["locations", "users", "id"],
				},
				expression: {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
					tableAlias: "t1",
				},
			},
		];

		const rows = [];
		const numAgencies = 2;
		const numLocations = 2;
		const numUsers = 2;
		for (let agencyId = numAgencies; agencyId > 0; agencyId--) {
			for (let locationId = numLocations; locationId > 0; locationId--) {
				for (let userId = numUsers; userId > 0; userId--) {
					rows.push({
						id: 100 + agencyId,
						"locations.id": 200 + locationId,
						"locations.users.id": 300 + userId,
					});
				}
			}
		}

		const result = mapRowsToClass(outputExpressions, rows);

		assert.deepEqual(result, [
			{
				id: 102,
				locations: [
					{
						id: 202,
						users: [
							{
								id: 302,
							},
							{
								id: 301,
							},
						],
					},
					{
						id: 201,
						users: [
							{
								id: 302,
							},
							{
								id: 301,
							},
						],
					},
				],
			},
			{
				id: 101,
				locations: [
					{
						id: 202,
						users: [
							{
								id: 302,
							},
							{
								id: 301,
							},
						],
					},
					{
						id: 201,
						users: [
							{
								id: 302,
							},
							{
								id: 301,
							},
						],
					},
				],
			},
		]);
	});

	it("Can map multiple rows with deeply nested sub-queries and similar values", function () {
		const querySelectDeeplyNested = {
			id: QUsers.id,
		};

		const querySelectNested = {
			id: QLocations.id,

			users: selectNestedMany(querySelectDeeplyNested),
		};

		const querySelect = {
			id: QAgencies.id,

			locations: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t3",
			}),
			{
				type: "aliasedExpressionNode",
				alias: {
					type: "aliasNode",
					name: "locations.id",
					path: ["locations", "id"],
				},
				expression: {
					type: "columnReferenceNode",
					tableName: "Locations",
					columnName: "id",
					tableAlias: "t2",
				},
			},
			{
				type: "aliasedExpressionNode",
				alias: {
					type: "aliasNode",
					name: "locations.users.id",
					path: ["locations", "users", "id"],
				},
				expression: {
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
					tableAlias: "t1",
				},
			},
		];

		const rows = [];
		const numAgencies = 2;
		const numLocations = 2;
		const numUsers = 2;
		for (let agencyId = numAgencies; agencyId > 0; agencyId--) {
			for (let locationId = numLocations; locationId > 0; locationId--) {
				for (let userId = numUsers; userId > 0; userId--) {
					rows.push({
						id: agencyId,
						"locations.id": locationId,
						"locations.users.id": userId,
					});
				}
			}
		}

		const result = mapRowsToClass(outputExpressions, rows);

		assert.deepEqual(result, [
			{
				id: 2,
				locations: [
					{
						id: 2,
						users: [
							{
								id: 2,
							},
							{
								id: 1,
							},
						],
					},
					{
						id: 1,
						users: [
							{
								id: 2,
							},
							{
								id: 1,
							},
						],
					},
				],
			},
			{
				id: 1,
				locations: [
					{
						id: 2,
						users: [
							{
								id: 2,
							},
							{
								id: 1,
							},
						],
					},
					{
						id: 1,
						users: [
							{
								id: 2,
							},
							{
								id: 1,
							},
						],
					},
				],
			},
		]);
	});

	it("Can map a nested sub-query with multiple rows", function () {
		const querySelectNested = {
			id: QUsers.id,
		};

		const querySelect = {
			id: QLocations.id,

			users: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];

		const rows = [
			{
				id: 123,
				"users.id": 456,
			},
			{
				id: 123,
				"users.id": 789,
			},
			{
				id: 321,
				"users.id": 654,
			},
		];

		const result = mapRowsToClass(outputExpressions, rows);

		assert.deepEqual(result, [
			{
				id: 123,
				users: [
					{
						id: 456,
					},
					{
						id: 789,
					},
				],
			},
			{
				id: 321,
				users: [
					{
						id: 654,
					},
				],
			},
		]);
	});

	it("Can map a nested sub-query with loooots of rows", function () {
		const querySelectNested = {
			id: QUsers.id,
		};

		const querySelect = {
			id: QLocations.id,

			users: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];

		const rows = [];
		const numNested = 100000;
		for (let i = 0; i < numNested; i++) {
			rows.push({
				id: 123,
				"users.id": i,
			});
		}

		const result = mapRowsToClass<typeof querySelect>(outputExpressions, rows);

		assert.deepEqual(result.length, 1);
		assert.deepEqual(result[0].id, 123);
		assert.deepEqual(result[0].users.length, numNested);
	});

	it("Preserves order of the rows", function () {
		const querySelect = {
			id: QUsers.id,
		};
		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		const numToGenerate = 5;
		const rows = [];
		for (let i = numToGenerate; i > 0; i--) {
			const row = {
				id: i,
			};
			rows.push(row);
		}

		const result = mapRowsToClass(outputExpressions, rows);

		assert.deepEqual(result, [
			{
				id: 5,
			},
			{
				id: 4,
			},
			{
				id: 3,
			},
			{
				id: 2,
			},
			{
				id: 1,
			},
		]);
	});

	it("Preserves order of the rows with nesting", function () {
		const querySelectNested = {
			id: QUsers.id,
		};

		const querySelect = {
			id: QLocations.id,

			users: selectNestedMany(querySelectNested),
		};

		const outputExpressions: SelectOutputExpression[] = [
			alias(["id"], {
				type: "columnReferenceNode",
				tableName: "Locations",
				columnName: "id",
				tableAlias: "t2",
			}),
			alias(["users", "id"], {
				type: "columnReferenceNode",
				tableName: "Users",
				columnName: "id",
				tableAlias: "t1",
			}),
		];
		const numToGenerate = 5;
		const rows = [];
		const expectedRows = [];
		for (let i = numToGenerate; i > 0; i--) {
			const expectedRow = {
				id: i,
				users: <QueryOutput<typeof querySelectNested>[]>[],
			};
			for (let j = numToGenerate; j > 0; j--) {
				const userId = i * 100 + j;
				const row = {
					id: i,
					"users.id": userId,
				};
				rows.push(row);
				expectedRow.users.push({
					id: userId,
				});
			}
			expectedRows.push(expectedRow);
		}

		const result = mapRowsToClass(outputExpressions, rows);

		assert.deepEqual(result, expectedRows);
	});

	it("Can map from function expressions", function () {
		const querySelect = {
			countValue: selectExpression(count()),
		};
		const outputExpressions: SelectOutputExpression[] = [
			{
				type: "aliasedExpressionNode",
				alias: {
					type: "aliasNode",
					name: "countValue",
					path: ["countValue"],
				},
				expression: {
					type: "functionExpressionNode",
					name: "count",
					arguments: [],
				},
			},
		];
		const row = {
			countValue: 123,
		};

		const result = mapRowToClass<typeof querySelect>(outputExpressions, row);

		assert.strictEqual(result.countValue, 123);
	});

	it("Cannot map from un-aliased function expressions", function () {
		const querySelect = {
			countValue: selectExpression(count()),
		};
		const outputExpressions: SelectOutputExpression[] = [
			{
				type: "functionExpressionNode",
				name: "count",
				arguments: [],
			},
		];
		const row = {
			countValue: 123,
		};

		assert.throws(() => {
			mapRowToClass<typeof querySelect>(outputExpressions, row);
		}, UnsupportedOperationError);
	});

	it("Cannot map from constants", function () {
		const querySelect = {};
		const outputExpressions: SelectOutputExpression[] = [
			<ConstantNode<any>>{
				type: "constantNode",
				getter: () => {},
			},
		];
		const row = {
			junk: 123,
		};

		assert.throws(() => {
			mapRowToClass<typeof querySelect>(outputExpressions, row);
		}, UnsupportedOperationError);
	});

	it("Cannot map from binary operations", function () {
		const querySelect = {};
		const outputExpressions: SelectOutputExpression[] = [
			{
				type: "binaryOperationNode",
				operator: "=",
				left: {
					type: "functionExpressionNode",
					name: "count",
					arguments: [],
				},
				right: {
					type: "functionExpressionNode",
					name: "count",
					arguments: [],
				},
			},
		];
		const row = {
			junk: 123,
		};

		assert.throws(() => {
			mapRowToClass<typeof querySelect>(outputExpressions, row);
		}, UnsupportedOperationError);
	});

	it("Cannot map from unary operations", function () {
		const querySelect = {};
		const outputExpressions: SelectOutputExpression[] = [
			{
				type: "unaryOperationNode",
				operator: "!",
				position: "left",
				expression: constant(true),
			},
		];
		const row = {
			junk: 123,
		};

		assert.throws(() => {
			mapRowToClass<typeof querySelect>(outputExpressions, row);
		}, UnsupportedOperationError);
	});
});

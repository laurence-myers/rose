import {RectifyingWalker} from "../src/query/walker";
import {SelectCommandNode, SubSelectNode} from "../src/query/ast";
import {DefaultMap} from "../src/lang";
import {equal} from "assert";

describe("AST Walkers", function () {
	describe("Rectifying Walker", function () {
		it("Rectifies a table referenced in a column reference node", function () {
			const ast : SelectCommandNode = {
				type: 'selectCommandNode',
				outputExpressions: [
					{
						type: "columnReferenceNode",
						tableName: "Users",
						columnName: "id"
					}
				],
				distinction: 'all',
				fromItems: [],
				joins: [],
				conditions: [],
				ordering: []
			};
			const tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
			const walker = new RectifyingWalker(tableMap, ast);
			walker.rectify();
			equal(ast.fromItems.length, 1);
			equal(ast.fromItems[0].tableName, "Users");
			equal(ast.fromItems[0].alias, "t1");
		});

		it("Does not rectify a table referenced in a column reference node and in a from item node", function () {
			const ast : SelectCommandNode = {
				type: 'selectCommandNode',
				outputExpressions: [
					{
						type: "columnReferenceNode",
						tableName: "Users",
						columnName: "id"
					}
				],
				distinction: 'all',
				fromItems: [
					{
						type: 'fromItemNode',
						tableName: "Users",
						alias: "t1"
					}
				],
				joins: [],
				conditions: [],
				ordering: []
			};
			const tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
			const walker = new RectifyingWalker(tableMap, ast);
			walker.rectify();
			equal(ast.fromItems.length, 1);
			equal(ast.fromItems[0].tableName, "Users");
			equal(ast.fromItems[0].alias, "t1");
		});

		it("Rectifies nested sub-queries individually, separate from the outer query", function () {
			const subSelectNode : SubSelectNode = {
				type: 'subSelectNode',
				query: {
					type: 'selectCommandNode',
					outputExpressions: [
						{
							type: "columnReferenceNode",
							tableName: "Locations",
							columnName: "id"
						}
					],
					distinction: 'all',
					fromItems: [],
					joins: [],
					conditions: [
						{
							type: 'binaryOperationNode',
							left: {
								type: "columnReferenceNode",
								tableName: "Locations",
								columnName: "id"
							},
							operator: '=',
							right: {
								type: 'constantNode',
								getter: (p : { locationId : number }) => p.locationId
							}
						}
					],
					ordering: []
				}
			};

			const ast : SelectCommandNode = {
				type: 'selectCommandNode',
				outputExpressions: [
					{
						type: "columnReferenceNode",
						tableName: "Users",
						columnName: "id"
					}
				],
				distinction: 'all',
				fromItems: [],
				joins: [],
				conditions: [
					{
						type: 'binaryOperationNode',
						left: {
							type: "columnReferenceNode",
							tableName: "Users",
							columnName: "locationId"
						},
						operator: '=',
						right: subSelectNode
					}
				],
				ordering: []
			};
			const tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
			const walker = new RectifyingWalker(tableMap, ast);
			walker.rectify();
			equal(ast.fromItems.length, 1);
			equal(ast.fromItems[0].tableName, "Users");
			equal(ast.fromItems[0].alias, "t2");
			equal(ast.conditions.length, 1);
			equal(subSelectNode.query.fromItems.length, 1);
			equal(subSelectNode.query.fromItems[0].tableName, "Locations");
			equal(subSelectNode.query.fromItems[0].alias, "t1");
		});
	});
});
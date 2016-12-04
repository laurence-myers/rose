import {AnalysingWalker} from "../src/query/walker";
import {SelectCommandNode} from "../src/query/ast";
import {deepEqual} from "assert";

describe("AST Walkers", function () {
	describe("Analysing Walker", function () {
		it("Finds a table referenced in a column reference node", function () {
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
			const walker = new AnalysingWalker(ast);
			const expected = ["Users"];
			const actual = walker.analyse();
			deepEqual(actual.tables, expected);
		});

		it("Does not report a table referenced in a column reference node and in a from item node", function () {
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
			const walker = new AnalysingWalker(ast);
			const expected = [];
			const actual = walker.analyse();
			deepEqual(actual.tables, expected);
		});
	});
});
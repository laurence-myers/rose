import {
	AliasedFromExpressionNode,
	FromItemNode,
	SelectCommandNode,
	SubSelectNode,
	TableReferenceNode,
} from "../../../src/query/ast";
import { RectifyingWalker } from "../../../src/query/walkers/rectifyingWalker";
import { deepEqual, equal, fail } from "assert";
import { select } from "../../../src/query/dsl/commands";
import {
	constant,
	selectExpression,
	selectSubQuery,
} from "../../../src/query/dsl";
import { sum } from "../../../src/query/dsl/postgresql/aggregate";
import { QRecurringPayments, TLocations } from "../../fixtures";
import { TableMap } from "../../../src/data";

function getFromItem(
	fromItem: FromItemNode
): AliasedFromExpressionNode | never {
	if (fromItem.type == "aliasedExpressionNode") {
		return fromItem;
	} else {
		throw fail(
			fromItem,
			"AliasedFromExpressionNode",
			"Expected an AliasedFromExpressionNode",
			"!="
		);
	}
}

describe("Rectifying Walker", function () {
	it("Rectifies a table referenced in a column reference node", function () {
		const ast: SelectCommandNode = {
			type: "selectCommandNode",
			outputExpressions: [
				{
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
				},
			],
			distinction: "all",
			fromItems: [],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: [],
			locking: [],
		};
		const tableMap = new TableMap();
		const walker = new RectifyingWalker(ast, tableMap);
		walker.rectify();
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal((fromItem.expression as TableReferenceNode).tableName, "Users");
		equal(fromItem.alias, "t1");
	});

	it("Does not rectify a table referenced in a column reference node and in a from item node", function () {
		const ast: SelectCommandNode = {
			type: "selectCommandNode",
			outputExpressions: [
				{
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
				},
			],
			distinction: "all",
			fromItems: [
				{
					type: "aliasedExpressionNode",
					alias: "t1",
					aliasPath: ["t1"],
					expression: {
						type: "tableReferenceNode",
						tableName: "Users",
					},
				},
			],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: [],
			locking: [],
		};
		const tableMap = new TableMap();
		const walker = new RectifyingWalker(ast, tableMap);
		walker.rectify();
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal((fromItem.expression as TableReferenceNode).tableName, "Users");
		equal(fromItem.alias, "t1");
		equal((fromItem.expression as TableReferenceNode).tableName, "Users");
		equal(fromItem.alias, "t1");
	});

	it("Rectifies nested sub-queries individually, separate from the outer query", function () {
		const subSelectNode: SubSelectNode = {
			type: "subSelectNode",
			query: {
				type: "selectCommandNode",
				outputExpressions: [
					{
						type: "columnReferenceNode",
						tableName: "Locations",
						columnName: "id",
					},
				],
				distinction: "all",
				fromItems: [],
				joins: [],
				conditions: [
					{
						type: "binaryOperationNode",
						left: {
							type: "columnReferenceNode",
							tableName: "Locations",
							columnName: "id",
						},
						operator: "=",
						right: {
							type: "constantNode",
							getter: (p: { locationId: number }) => p.locationId,
						},
					},
				],
				ordering: [],
				grouping: [],
				locking: [],
			},
			tableMap: new TableMap(),
		};

		const ast: SelectCommandNode = {
			type: "selectCommandNode",
			outputExpressions: [
				{
					type: "columnReferenceNode",
					tableName: "Users",
					columnName: "id",
				},
			],
			distinction: "all",
			fromItems: [],
			joins: [],
			conditions: [
				{
					type: "binaryOperationNode",
					left: {
						type: "columnReferenceNode",
						tableName: "Users",
						columnName: "locationId",
					},
					operator: "=",
					right: subSelectNode,
				},
			],
			ordering: [],
			grouping: [],
			locking: [],
		};
		const tableMap = new TableMap();
		const walker = new RectifyingWalker(ast, tableMap);
		walker.rectify();
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal((fromItem.expression as TableReferenceNode).tableName, "Users");
		equal(fromItem.alias, "t1");
		equal(ast.conditions.length, 1);
		equal(subSelectNode.query.fromItems.length, 1);
		const nestedFromItem = getFromItem(subSelectNode.query.fromItems[0]);
		equal(
			(nestedFromItem.expression as TableReferenceNode).tableName,
			"Locations"
		);
		equal(nestedFromItem.alias, "t1");
	});

	it("Rectifies nested sub-queries individually, retaining aliased tables referenced from the outer query", function () {
		// Setup
		const locations = new TLocations("locations");
		const amountSubQuery = selectSubQuery("amountSumT", {
			amountSum: selectExpression(sum(QRecurringPayments.amount.col())),
		}).where(QRecurringPayments.locationId.eq(locations.id));

		const actual = select({
			name: locations.name,
			amount: amountSubQuery.toMetamodel().amountSum,
		})
			.from(locations, amountSubQuery)
			.where(locations.id.eq(constant(123)));

		const ast = (actual as unknown as { queryAst: SelectCommandNode }).queryAst;

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		equal(ast.fromItems.length, 2);
		const firstFromItem = getFromItem(ast.fromItems[0]);
		equal(firstFromItem.alias, "locations");
		const secondFromItem = getFromItem(ast.fromItems[1]);
		equal(secondFromItem.alias, "amountSumT");
		const subQueryNode = (secondFromItem.expression as SubSelectNode).query;
		equal(
			subQueryNode.fromItems.length,
			1,
			'The inner query should not add "Locations" to its "from" clause'
		);
		const firstNestedFromItem = getFromItem(subQueryNode.fromItems[0]);
		equal(firstNestedFromItem.alias, "t1");
	});

	it("Rectifies unaliased FROM locations", function () {
		const ast: SelectCommandNode = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: [
				{
					type: "aliasedExpressionNode",
					alias: "region",
					aliasPath: ["region"],
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableName: "orders",
						tableAlias: undefined,
					},
				},
				{
					type: "aliasedExpressionNode",
					alias: "total_sales",
					aliasPath: ["total_sales"],
					expression: {
						type: "functionExpressionNode",
						name: "sum",
						arguments: [
							{
								type: "columnReferenceNode",
								columnName: "amount",
								tableName: "orders",
								tableAlias: undefined,
							},
						],
					},
				},
			],
			fromItems: [
				{
					type: "aliasedExpressionNode",
					alias: "t1",
					aliasPath: ["t1"],
					expression: {
						type: "tableReferenceNode",
						tableName: "orders",
					},
				},
			],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: [
				{
					type: "groupByExpressionNode",
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableName: "orders",
						tableAlias: undefined,
					},
				},
			],
			locking: [],
		};
		const tableMap = new TableMap();
		const walker = new RectifyingWalker(ast, tableMap);
		walker.rectify();

		const expected = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: [
				{
					type: "aliasedExpressionNode",
					alias: "region",
					aliasPath: ["region"],
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableName: "orders",
						tableAlias: "t1",
					},
				},
				{
					type: "aliasedExpressionNode",
					alias: "total_sales",
					aliasPath: ["total_sales"],
					expression: {
						type: "functionExpressionNode",
						name: "sum",
						arguments: [
							{
								type: "columnReferenceNode",
								columnName: "amount",
								tableName: "orders",
								tableAlias: "t1",
							},
						],
					},
				},
			],
			fromItems: [
				{
					type: "aliasedExpressionNode",
					alias: "t1",
					aliasPath: ["t1"],
					expression: {
						type: "tableReferenceNode",
						tableName: "orders",
					},
				},
			],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: [
				{
					type: "groupByExpressionNode",
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableName: "orders",
						tableAlias: "t1",
					},
				},
			],
			locking: [],
		};
		deepEqual(ast, expected);
	});
});

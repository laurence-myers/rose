import {
	BooleanExpression,
	ColumnReferenceNode,
	FromItemNode,
	FromItemSubSelectNode,
	FromItemTableNode,
	SelectCommandNode,
	SelectOutputExpression,
	SubSelectNode,
} from "../../../src/query/ast";
import { RectifyingWalker } from "../../../src/query/walkers/rectifyingWalker";
import { deepEqual, equal, fail } from "assert";
import { select } from "../../../src/query/dsl/commands";
import {
	constant,
	from,
	selectExpression,
	selectSubQuery,
} from "../../../src/query/dsl";
import { sum } from "../../../src/query/dsl/postgresql/aggregate";
import { QRecurringPayments, QUsers, TLocations, TUsers } from "../../fixtures";

function getFromItem(fromItem: FromItemNode): FromItemTableNode | never {
	if (fromItem.type == "fromItemTableNode") {
		return fromItem;
	} else {
		throw fail(
			fromItem,
			"FromItemTableNode",
			"Expected a FromItemTableNode",
			"!="
		);
	}
}

describe("Rectifying Walker", function () {
	function buildSelectNode(
		outputExpressions: SelectOutputExpression[],
		fromItems: FromItemNode[],
		conditions: BooleanExpression[] = []
	): SelectCommandNode {
		return {
			type: "selectCommandNode",
			outputExpressions: outputExpressions,
			distinction: "all",
			fromItems: fromItems,
			conditions,
			ordering: [],
			grouping: [],
			locking: [],
		};
	}

	it("Rectifies a table referenced in a column reference node", function () {
		// Setup
		const ast: SelectCommandNode = buildSelectNode([QUsers.id.col()], []);

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal(fromItem.table, "Users");
		equal(fromItem.alias?.name, "t1");
	});

	it("Does not rectify a table referenced in a column reference node and in a from item node", function () {
		// Setup
		const aliasedTable = new TUsers("explicitAlias");
		const ast: SelectCommandNode = buildSelectNode(
			[aliasedTable.id.col()],
			[from(aliasedTable).toNode()]
		);

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal(fromItem.table, "Users");
		equal(fromItem.alias?.name, "explicitAlias");
		equal(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(ast.outputExpressions[0]! as ColumnReferenceNode).tableOrAlias,
			"explicitAlias"
		);
	});

	it("Rectifies a table referenced in a column reference node, when there is a from item node with a different alias", function () {
		// Setup
		const aliasedTable = new TUsers("explicitAlias");
		const ast: SelectCommandNode = buildSelectNode(
			[QUsers.id.col()],
			[from(aliasedTable).toNode()]
		);

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		equal(ast.fromItems.length, 2);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal(fromItem.table, "Users");
		equal(fromItem.alias?.name, "explicitAlias");
		const fromItem2 = getFromItem(ast.fromItems[1]);
		equal(fromItem2.table, "Users");
		equal(fromItem2.alias?.name, "t1");
		equal(
			(ast.outputExpressions[0]! as ColumnReferenceNode).tableOrAlias,
			"t1"
		);
	});

	it("Rectifies nested sub-queries individually, separate from the outer query", function () {
		// Setup
		const subSelectNode: SubSelectNode = {
			type: "subSelectNode",
			query: buildSelectNode(
				[
					{
						type: "columnReferenceNode",
						tableOrAlias: "Locations",
						columnName: "id",
					},
				],
				[],
				[
					{
						type: "binaryOperationNode",
						left: {
							type: "columnReferenceNode",
							tableOrAlias: "Locations",
							columnName: "id",
						},
						operator: "=",
						right: {
							type: "constantNode",
							getter: (p: { locationId: number }) => p.locationId,
						},
					},
				]
			),
		};

		const ast: SelectCommandNode = buildSelectNode(
			[
				{
					type: "columnReferenceNode",
					tableOrAlias: "Users",
					columnName: "id",
				},
			],
			[],
			[
				{
					type: "binaryOperationNode",
					left: {
						type: "columnReferenceNode",
						tableOrAlias: "Users",
						columnName: "locationId",
					},
					operator: "=",
					right: subSelectNode,
				},
			]
		);

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		equal(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		equal(fromItem.table, "Users");
		equal(fromItem.alias?.name, "t1");
		equal(ast.conditions.length, 1);
		equal(subSelectNode.query.fromItems.length, 1);
		const nestedFromItem = getFromItem(subSelectNode.query.fromItems[0]);
		equal(nestedFromItem.table, "Locations");
		equal(nestedFromItem.alias?.name, "t1");
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
		equal(firstFromItem.alias?.name, "locations");
		const secondFromItem = ast.fromItems[1];
		equal((secondFromItem as FromItemSubSelectNode).alias?.name, "amountSumT");
		const subQueryNode = (secondFromItem as FromItemSubSelectNode).query.query;
		equal(
			subQueryNode.fromItems.length,
			1,
			'The inner query should not add "Locations" to its "from" clause'
		);
		const firstNestedFromItem = getFromItem(subQueryNode.fromItems[0]);
		equal(firstNestedFromItem.alias?.name, "t1");
	});

	it("Rectifies unaliased FROM locations", function () {
		const ast: SelectCommandNode = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: [
				{
					type: "aliasedExpressionNode",
					alias: {
						type: "aliasNode",
						name: "region",
						path: ["region"],
					},
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableOrAlias: "orders",
					},
				},
				{
					type: "aliasedExpressionNode",
					alias: {
						type: "aliasNode",
						name: "total_sales",
						path: ["total_sales"],
					},
					expression: {
						type: "functionExpressionNode",
						name: "sum",
						arguments: [
							{
								type: "columnReferenceNode",
								columnName: "amount",
								tableOrAlias: "orders",
							},
						],
					},
				},
			],
			fromItems: [
				{
					type: "fromItemTableNode",
					alias: undefined,
					table: "orders",
				},
			],
			conditions: [],
			ordering: [],
			grouping: [
				{
					type: "groupByExpressionNode",
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableOrAlias: "orders",
					},
				},
			],
			locking: [],
		};
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		const expected: SelectCommandNode = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: [
				{
					type: "aliasedExpressionNode",
					alias: {
						type: "aliasNode",
						name: "region",
						path: ["region"],
					},
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableOrAlias: "t1",
					},
				},
				{
					type: "aliasedExpressionNode",
					alias: {
						type: "aliasNode",
						name: "total_sales",
						path: ["total_sales"],
					},
					expression: {
						type: "functionExpressionNode",
						name: "sum",
						arguments: [
							{
								type: "columnReferenceNode",
								columnName: "amount",
								tableOrAlias: "t1",
							},
						],
					},
				},
			],
			fromItems: [
				{
					type: "fromItemTableNode",
					alias: {
						type: "aliasNode",
						name: "t1",
						path: ["t1"],
					},
					table: "orders",
				},
			],
			conditions: [],
			ordering: [],
			grouping: [
				{
					type: "groupByExpressionNode",
					expression: {
						type: "columnReferenceNode",
						columnName: "region",
						tableOrAlias: "t1",
					},
				},
			],
			locking: [],
		};
		deepEqual(ast, expected);
	});
});

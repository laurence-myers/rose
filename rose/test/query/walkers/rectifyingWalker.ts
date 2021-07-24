import {
	BooleanBinaryOperationNode,
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
import { deepStrictEqual, strictEqual } from "assert";
import { select } from "../../../src/query/dsl/commands";
import {
	constant,
	from,
	param,
	selectExpression,
	selectSubQuery,
	subSelect,
	withCte,
} from "../../../src/query/dsl";
import { sum } from "../../../src/query/dsl/postgresql/aggregate";
import {
	QLocations,
	QOrders,
	QRecurringPayments,
	QUsers,
	TLocations,
	TUsers,
} from "../../fixtures";

function getFromItem(fromItem: FromItemNode): FromItemTableNode {
	if (fromItem.type == "fromItemTableNode") {
		return fromItem;
	} else {
		strictEqual(fromItem.type, "FromItemTableNode");
		throw new Error(`Shouldn't get here`);
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
		strictEqual(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		strictEqual(fromItem.table, "Users");
		strictEqual(fromItem.alias?.name, undefined);
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
		strictEqual(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		strictEqual(fromItem.table, "Users");
		strictEqual(fromItem.alias?.name, "explicitAlias");
		strictEqual(
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
		strictEqual(ast.fromItems.length, 2);
		const fromItem = getFromItem(ast.fromItems[0]);
		strictEqual(fromItem.table, "Users");
		strictEqual(fromItem.alias?.name, "explicitAlias");
		const fromItem2 = getFromItem(ast.fromItems[1]);
		strictEqual(fromItem2.table, "Users");
		strictEqual(fromItem2.alias?.name, undefined);
		strictEqual(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(ast.outputExpressions[0]! as ColumnReferenceNode).tableOrAlias,
			"Users"
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
		strictEqual(ast.fromItems.length, 1);
		const fromItem = getFromItem(ast.fromItems[0]);
		strictEqual(fromItem.table, "Users");
		strictEqual(fromItem.alias?.name, undefined);
		strictEqual(ast.conditions.length, 1);
		strictEqual(subSelectNode.query.fromItems.length, 1);
		const nestedFromItem = getFromItem(subSelectNode.query.fromItems[0]);
		strictEqual(nestedFromItem.table, "Locations");
		strictEqual(nestedFromItem.alias?.name, undefined);
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
		strictEqual(ast.fromItems.length, 2);
		const firstFromItem = getFromItem(ast.fromItems[0]);
		strictEqual(firstFromItem.alias?.name, "locations");
		const secondFromItem = ast.fromItems[1];
		strictEqual(
			(secondFromItem as FromItemSubSelectNode).alias?.name,
			"amountSumT"
		);
		const subQueryNode = (secondFromItem as FromItemSubSelectNode).query.query;
		strictEqual(
			subQueryNode.fromItems.length,
			1,
			'The inner query should not add "Locations" to its "from" clause'
		);
		const firstNestedFromItem = getFromItem(subQueryNode.fromItems[0]);
		strictEqual(firstNestedFromItem.alias?.name, undefined);
	});

	it("Does not change references to unaliased FROM items", function () {
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

		const expected: SelectCommandNode = ast;
		deepStrictEqual(ast, expected);
	});

	it(`Rectifies outer query and sub-query separately when referencing the same table`, function () {
		// Setup
		const query = select({
			id: QLocations.id,
		}).where(
			QLocations.id.in(
				subSelect(QLocations.id)
					.where(QLocations.agencyId.eq(param(() => 1)))
					.toNode()
			)
		);

		const ast = (query as unknown as { queryAst: SelectCommandNode }).queryAst;

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		strictEqual(ast.fromItems.length, 1);
		const firstFromItem = getFromItem(ast.fromItems[0]);
		strictEqual(firstFromItem.alias, undefined);
		strictEqual(firstFromItem.table, "Locations");
		const subQueryNode = (
			(ast.conditions[0] as BooleanBinaryOperationNode).right as SubSelectNode
		).query;
		strictEqual(
			subQueryNode.fromItems.length,
			1,
			'The inner query should add "Locations" to its own "from" clause'
		);
		const firstNestedFromItem = getFromItem(subQueryNode.fromItems[0]);
		strictEqual(firstNestedFromItem.alias, undefined);
		strictEqual(firstNestedFromItem.table, "Locations");
	});

	it("Rectifies CTE references", function () {
		// Setup
		const regionalSalesName = `regional_sales`;
		const regionalSalesQuery = select({
			region: QOrders.region,
		});
		const regionalSales = withCte(regionalSalesName, regionalSalesQuery);
		const regionalSalesMetamodel =
			regionalSalesQuery.toMetamodel(regionalSalesName);

		const topRegionsCteName = `top_regions`;
		const topRegions = withCte(
			topRegionsCteName,
			select({
				region: regionalSalesMetamodel.region,
			})
		);

		const query = select({
			region: regionalSalesMetamodel.region,
		}).with(regionalSales, topRegions);

		const ast = (query as unknown as { queryAst: SelectCommandNode }).queryAst;

		// Execute
		const walker = new RectifyingWalker(ast);
		walker.rectify();

		// Verify
		strictEqual(
			(ast.with?.[0]?.query.fromItems[0] as FromItemTableNode)?.table,
			QOrders.$table.name
		);
		// Although the second FROM item should be a `FromItemWithNode`, the rectifier currently only produces table references.
		strictEqual(
			(ast.with?.[1]?.query.fromItems[0] as FromItemTableNode)?.table,
			regionalSalesName
		);
	});
});

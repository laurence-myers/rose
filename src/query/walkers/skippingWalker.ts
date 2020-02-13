import {
	AnyAliasedExpressionNode,
	BinaryOperationNode,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
	ConstantNode,
	DeleteCommandNode,
	ExpressionListNode,
	FunctionExpressionNode,
	GroupByExpressionNode,
	InsertCommandNode,
	JoinNode,
	LimitOffsetNode,
	LiteralNode,
	NaturalSyntaxFunctionExpressionNode,
	NotExpressionNode,
	OrderByExpressionNode,
	SelectCommandNode,
	SetItemNode,
	SimpleColumnReferenceNode,
	SubSelectNode,
	TableReferenceNode,
	UnaryOperationNode,
	UpdateCommandNode,
	WithNode
} from "../ast";
import { BaseWalker } from "./baseWalker";

/**
 * Walks through the AST graph without performing any actions.
 * Extend this class to implement your own behaviour, such as static analysis.
 */
export class SkippingWalker extends BaseWalker {
	protected walkAliasedExpressionNode(node: AnyAliasedExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkBinaryOperationNode(node: BinaryOperationNode): void {
		this.walk(node.left);
		this.walk(node.right);
	}

	protected walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void {
		node.expressions.forEach(this.doItemWalk());
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
	}

	protected walkDeleteCommandNode(node: DeleteCommandNode): void {
		this.walk(node.from);
		node.conditions.forEach(this.doItemWalk());
	}

	protected walkConstantNode(node: ConstantNode<any>): void {
	}

	protected walkExpressionListNode(node: ExpressionListNode): void {
		node.expressions.forEach(this.doItemWalk());
	}

	protected walkFunctionExpressionNode(node: FunctionExpressionNode): void {
		node.arguments.forEach(this.doItemWalk());
	}

	protected walkGroupByExpressionNode(node: GroupByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkInsertCommandNode(node: InsertCommandNode): void {
		this.walk(node.table);
		node.columns.forEach(this.doItemWalk());
		for (const values of node.values) {
			values.forEach(this.doItemWalk());
		}
	}

	protected walkLimitOffsetNode(node: LimitOffsetNode): void {
	}

	protected walkLiteralNode(node: LiteralNode): void {
	}

	protected walkJoinNode(node: JoinNode): void {
		this.walk(node.fromItem);
		if (node.on) {
			this.walk(node.on);
		}
		if (node.using) {
			node.using.forEach(this.doItemWalk());
		}
	}

	protected walkNaturalSyntaxFunctionExpressionNode(node: NaturalSyntaxFunctionExpressionNode): void {
		node.arguments.map((node) => node.value)
			.forEach(this.doItemWalk());
	}

	protected walkNotExpressionNode(node: NotExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkOrderByExpressionNode(node: OrderByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkSelectCommandNode(node: SelectCommandNode): void {
		node.outputExpressions.forEach(this.doItemWalk());
		node.fromItems.forEach(this.doItemWalk());
		node.joins.forEach(this.doItemWalk());
		node.conditions.forEach(this.doItemWalk());
		node.ordering.forEach(this.doItemWalk());
		node.grouping.forEach(this.doItemWalk());
	}

	protected walkSetItemNode(node: SetItemNode): void {
	}

	protected walkSimpleColumnReferenceNode(node: SimpleColumnReferenceNode): void {

	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		this.walk(node.query);
	}

	protected walkTableReferenceNode(node: TableReferenceNode): void {
	}

	protected walkUnaryOperationNode(node: UnaryOperationNode): void {
		this.walk(node.expression);
	}

	protected walkUpdateCommandNode(node: UpdateCommandNode): void {
		this.walk(node.table);
		node.setItems.forEach(this.doItemWalk());
		node.fromItems.forEach(this.doItemWalk());
		node.conditions.forEach(this.doItemWalk());
	}

	protected walkWithNode(node: WithNode): void {
		node.selectNodes.forEach(this.doItemWalk());
	}
}

import {
	AnyAliasedExpressionNode,
	BeginCommandNode,
	BinaryOperationNode,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
	CommitCommandNode,
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
	ReleaseSavepointCommandNode,
	RollbackCommandNode,
	RollbackToSavepointCommandNode,
	SavepointCommandNode,
	SelectCommandNode,
	SetItemNode,
	SetSessionsCharacteristicsAsTransactionCommandNode,
	SetTransactionCommandNode,
	SetTransactionSnapshotCommandNode,
	SimpleColumnReferenceNode,
	SubSelectNode,
	TableReferenceNode, TransactionModeNode,
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

	protected walkBeginCommandNode(node: BeginCommandNode): void {
		if (node.transactionMode) {
			this.walk(node.transactionMode);
		}
	}

	protected walkBinaryOperationNode(node: BinaryOperationNode): void {
		this.walk(node.left);
		this.walk(node.right);
	}

	protected walkCommitCommandNode(node: CommitCommandNode): void {
	}

	protected walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void {
		this.walkNodes(node.expressions);
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
	}

	protected walkDeleteCommandNode(node: DeleteCommandNode): void {
		this.walk(node.from);
		this.walkNodes(node.conditions);
	}

	protected walkConstantNode(node: ConstantNode<unknown>): void {
	}

	protected walkExpressionListNode(node: ExpressionListNode): void {
		this.walkNodes(node.expressions);
	}

	protected walkFunctionExpressionNode(node: FunctionExpressionNode): void {
		this.walkNodes(node.arguments);
	}

	protected walkGroupByExpressionNode(node: GroupByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkInsertCommandNode(node: InsertCommandNode): void {
		this.walk(node.table);
		this.walkNodes(node.columns);
		for (const values of node.values) {
			this.walkNodes(values);
		}
		if (node.query) {
			this.walk(node.query);
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
			this.walkNodes(node.using);
		}
	}

	protected walkNaturalSyntaxFunctionExpressionNode(node: NaturalSyntaxFunctionExpressionNode): void {
		this.walkNodes(
			node.arguments.map((node) => node.value)
		);
	}

	protected walkNotExpressionNode(node: NotExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkOrderByExpressionNode(node: OrderByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkReleaseSavepointCommandNode(node: ReleaseSavepointCommandNode): void {
		this.walk(node.name);
	}

	protected walkRollbackCommandNode(node: RollbackCommandNode): void {
	}

	protected walkRollbackToSavepointCommandNode(node: RollbackToSavepointCommandNode): void {
		this.walk(node.name);
	}

	protected walkSavepointCommandNode(node: SavepointCommandNode): void {
		this.walk(node.name);
	}

	protected walkSelectCommandNode(node: SelectCommandNode): void {
		this.walkNodes(node.outputExpressions);
		this.walkNodes(node.fromItems);
		this.walkNodes(node.joins);
		this.walkNodes(node.conditions);
		this.walkNodes(node.ordering);
		this.walkNodes(node.grouping);
	}

	protected walkSetItemNode(node: SetItemNode): void {
	}

	protected walkSetSessionsCharacteristicsAsTransactionCommandNode(node: SetSessionsCharacteristicsAsTransactionCommandNode): void {
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionCommandNode(node: SetTransactionCommandNode): void {
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionSnapshotCommandNode(node: SetTransactionSnapshotCommandNode): void {
		this.walk(node.snapshotId);
	}

	protected walkSimpleColumnReferenceNode(node: SimpleColumnReferenceNode): void {

	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		this.walk(node.query);
	}

	protected walkTableReferenceNode(node: TableReferenceNode): void {
	}

	protected walkTransactionModeNode(node: TransactionModeNode): void {
	}

	protected walkUnaryOperationNode(node: UnaryOperationNode): void {
		this.walk(node.expression);
	}

	protected walkUpdateCommandNode(node: UpdateCommandNode): void {
		this.walk(node.table);
		this.walkNodes(node.setItems);
		this.walkNodes(node.fromItems);
		this.walkNodes(node.conditions);
	}

	protected walkWithNode(node: WithNode): void {
		this.walkNodes(node.selectNodes);
	}
}

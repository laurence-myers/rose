import {
	AliasNode,
	AnyAliasedExpressionNode,
	ArrayConstructorNode,
	BeginCommandNode,
	BinaryOperationNode,
	BooleanExpressionGroupNode,
	CastNode,
	ColumnDefinitionNode,
	ColumnReferenceNode,
	CommitCommandNode,
	ConstantNode,
	DeleteCommandNode,
	ExpressionListNode,
	FromItemFunctionNode,
	FromItemJoinNode,
	FromItemSubSelectNode,
	FromItemTableNode,
	FromItemWithNode,
	FunctionExpressionNode,
	GroupByExpressionNode,
	InsertCommandNode,
	LimitOffsetNode,
	LiteralNode,
	NaturalSyntaxFunctionExpressionNode,
	NotExpressionNode,
	OnConflictDoNothingNode,
	OnConflictDoUpdateNode,
	OnConflictNode,
	OnConflictTargetIndexesNode,
	OnConflictTargetIndexNode,
	OnConflictTargetOnConstraintNode,
	OrderByExpressionNode,
	ReleaseSavepointCommandNode,
	RollbackCommandNode,
	RollbackToSavepointCommandNode,
	RowConstructorNode,
	SavepointCommandNode,
	SelectCommandNode,
	SelectLockingNode,
	SetItemNode,
	SetSessionsCharacteristicsAsTransactionCommandNode,
	SetTransactionCommandNode,
	SetTransactionSnapshotCommandNode,
	SimpleColumnReferenceNode,
	SubscriptNode,
	SubSelectNode,
	TransactionModeNode,
	UnaryOperationNode,
	UpdateCommandNode,
	WithNode,
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

	protected walkAliasNode(node: AliasNode) {}

	protected walkArrayConstructorNode(node: ArrayConstructorNode): void {
		this.walkNodes(node.expressions);
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

	protected walkCastNode(node: CastNode): void {
		this.walk(node.expression);
	}

	protected walkColumnDefinitionNode(node: ColumnDefinitionNode): void {}

	protected walkCommitCommandNode(node: CommitCommandNode): void {}

	protected walkBooleanExpressionGroupNode(
		node: BooleanExpressionGroupNode
	): void {
		this.walkNodes(node.expressions);
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {}

	protected walkDeleteCommandNode(node: DeleteCommandNode): void {
		this.walk(node.from);
		this.walkNodes(node.conditions);
	}

	protected walkConstantNode(node: ConstantNode<unknown>): void {}

	protected walkExpressionListNode(node: ExpressionListNode): void {
		this.walkNodes(node.expressions);
	}

	protected walkFromItemFunctionNode(node: FromItemFunctionNode): void {
		for (const subNode of node.functionExpressions) {
			this.walk(subNode.functionExpression);
			if (subNode.columnDefinitions) {
				this.walkNodes(subNode.columnDefinitions);
			}
		}
		if (node.alias) {
			this.walk(node.alias);
		}
	}

	protected walkFromItemJoinNode(node: FromItemJoinNode): void {
		this.walk(node.leftFromItem);
		this.walk(node.rightFromItem);
		if (node.on) {
			this.walk(node.on);
		}
		if (node.using) {
			this.walkNodes(node.using);
		}
	}

	protected walkFromItemSubSelectNode(node: FromItemSubSelectNode): void {
		this.walk(node.query);
		this.walk(node.alias);
	}

	protected walkFromItemTableNode(node: FromItemTableNode): void {
		if (node.alias) {
			this.walk(node.alias);
		}
		if (node.tableSample) {
			this.walkNodes(node.tableSample.arguments);
			if (node.tableSample.repeatableSeed) {
				this.walk(node.tableSample.repeatableSeed);
			}
		}
	}

	protected walkFromItemWithNode(node: FromItemWithNode): void {
		if (node.alias) {
			this.walk(node.alias);
		}
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
		if (node.onConflict) {
			this.walk(node.onConflict);
		}
		if (node.returning) {
			this.walkNodes(node.returning);
		}
	}

	protected walkLimitOffsetNode(node: LimitOffsetNode): void {}

	protected walkLiteralNode(node: LiteralNode): void {}

	protected walkNaturalSyntaxFunctionExpressionNode(
		node: NaturalSyntaxFunctionExpressionNode
	): void {
		this.walkNodes(node.arguments.map((node) => node.value));
	}

	protected walkNotExpressionNode(node: NotExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkOnConflictDoNothingNode(node: OnConflictDoNothingNode): void {
		if (node.target) {
			this.walk(node.target);
		}
	}

	protected walkOnConflictDoUpdateNode(node: OnConflictDoUpdateNode): void {
		this.walk(node.target);
		this.walkNodes(node.setItems);
		if (node.where) {
			this.walk(node.where);
		}
	}

	protected walkOnConflictNode(node: OnConflictNode): void {
		this.walk(node.conflictAction);
	}

	protected walkOnConflictTargetIndexesNode(
		node: OnConflictTargetIndexesNode
	): void {
		this.walkNodes(node.indexes);
		if (node.where) {
			this.walk(node.where);
		}
	}

	protected walkOnConflictTargetIndexNode(
		node: OnConflictTargetIndexNode
	): void {
		this.walk(node.identifier);
	}

	protected walkOnConflictTargetOnConstraintNode(
		node: OnConflictTargetOnConstraintNode
	): void {}

	protected walkOrderByExpressionNode(node: OrderByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkReleaseSavepointCommandNode(
		node: ReleaseSavepointCommandNode
	): void {
		this.walk(node.name);
	}

	protected walkRollbackCommandNode(node: RollbackCommandNode): void {}

	protected walkRollbackToSavepointCommandNode(
		node: RollbackToSavepointCommandNode
	): void {
		this.walk(node.name);
	}

	protected walkRowConstructorNode(node: RowConstructorNode): void {
		this.walk(node.expressionList);
	}

	protected walkSavepointCommandNode(node: SavepointCommandNode): void {
		this.walk(node.name);
	}

	protected walkSelectCommandNode(node: SelectCommandNode): void {
		if (node.with) {
			this.walkNodes(node.with);
		}
		this.walkNodes(node.outputExpressions);
		this.walkNodes(node.fromItems);
		this.walkNodes(node.conditions);
		this.walkNodes(node.ordering);
		this.walkNodes(node.grouping);
		this.walkNodes(node.locking);
	}

	protected walkSelectLockingNode(node: SelectLockingNode): void {}

	protected walkSetItemNode(node: SetItemNode): void {}

	protected walkSetSessionsCharacteristicsAsTransactionCommandNode(
		node: SetSessionsCharacteristicsAsTransactionCommandNode
	): void {
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionCommandNode(
		node: SetTransactionCommandNode
	): void {
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionSnapshotCommandNode(
		node: SetTransactionSnapshotCommandNode
	): void {
		this.walk(node.snapshotId);
	}

	protected walkSimpleColumnReferenceNode(
		node: SimpleColumnReferenceNode
	): void {}

	protected walkSubscriptNode(node: SubscriptNode): void {
		this.walk(node.expression);
		this.walk(node.lowerSubscript);
		if (node.upperSubscript) {
			this.walk(node.upperSubscript);
		}
	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		this.walk(node.query);
	}

	protected walkTransactionModeNode(node: TransactionModeNode): void {}

	protected walkUnaryOperationNode(node: UnaryOperationNode): void {
		this.walk(node.expression);
	}

	protected walkUpdateCommandNode(node: UpdateCommandNode): void {
		this.walk(node.table);
		this.walkNodes(node.setItems);
		this.walkNodes(node.fromItems);
		this.walkNodes(node.conditions);
		if (node.returning) {
			this.walkNodes(node.returning);
		}
	}

	protected walkWithNode(node: WithNode): void {
		this.walk(node.query);
	}
}

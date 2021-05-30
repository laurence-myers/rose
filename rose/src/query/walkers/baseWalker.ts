import {
	AnyAliasedExpressionNode,
	ArrayConstructorNode,
	AstNode,
	BeginCommandNode,
	BinaryOperationNode,
	BooleanExpressionGroupNode,
	CastNode,
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
	TableReferenceNode,
	TransactionModeNode,
	UnaryOperationNode,
	UpdateCommandNode,
	WithNode
} from "../ast";
import { assertNever } from "../../lang";

export abstract class BaseWalker {
	protected abstract walkAliasedExpressionNode(node: AnyAliasedExpressionNode): void;

	protected abstract walkArrayConstructorNode(node: ArrayConstructorNode): void;

	protected abstract walkBeginCommandNode(node: BeginCommandNode): void;

	protected abstract walkBinaryOperationNode(node: BinaryOperationNode): void;

	protected abstract walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void;

	protected abstract walkCastNode(node: CastNode): void;

	protected abstract walkColumnReferenceNode(node: ColumnReferenceNode): void;

	protected abstract walkCommitCommandNode(node: CommitCommandNode): void;

	protected abstract walkConstantNode(node: ConstantNode<any>): void;

	protected abstract walkDeleteCommandNode(node: DeleteCommandNode): void;

	protected abstract walkExpressionListNode(node: ExpressionListNode): void;

	protected abstract walkFunctionExpressionNode(node: FunctionExpressionNode): void;

	protected abstract walkGroupByExpressionNode(node: GroupByExpressionNode): void;

	protected abstract walkInsertCommandNode(node: InsertCommandNode): void;

	protected abstract walkJoinNode(node: JoinNode): void;

	protected abstract walkLimitOffsetNode(node: LimitOffsetNode): void;

	protected abstract walkLiteralNode(node: LiteralNode): void;

	protected abstract walkNaturalSyntaxFunctionExpressionNode(node: NaturalSyntaxFunctionExpressionNode): void;

	protected abstract walkNotExpressionNode(node: NotExpressionNode): void;

	protected abstract walkOnConflictDoNothingNode(node: OnConflictDoNothingNode): void;

	protected abstract walkOnConflictDoUpdateNode(node: OnConflictDoUpdateNode): void;

	protected abstract walkOnConflictNode(node: OnConflictNode): void;

	protected abstract walkOnConflictTargetIndexesNode(node: OnConflictTargetIndexesNode): void;

	protected abstract walkOnConflictTargetIndexNode(node: OnConflictTargetIndexNode): void;

	protected abstract walkOnConflictTargetOnConstraintNode(node: OnConflictTargetOnConstraintNode): void;

	protected abstract walkOrderByExpressionNode(node: OrderByExpressionNode): void;

	protected abstract walkReleaseSavepointCommandNode(node: ReleaseSavepointCommandNode): void;

	protected abstract walkRollbackCommandNode(node: RollbackCommandNode): void;

	protected abstract walkRollbackToSavepointCommandNode(node: RollbackToSavepointCommandNode): void;

	protected abstract walkRowConstructorNode(node: RowConstructorNode): void;

	protected abstract walkSavepointCommandNode(node: SavepointCommandNode): void;

	protected abstract walkSelectCommandNode(node: SelectCommandNode): void;

	protected abstract walkSelectLockingNode(node: SelectLockingNode): void;

	protected abstract walkSetItemNode(node: SetItemNode): void;

	protected abstract walkSetSessionsCharacteristicsAsTransactionCommandNode(node: SetSessionsCharacteristicsAsTransactionCommandNode): void;

	protected abstract walkSetTransactionCommandNode(node: SetTransactionCommandNode): void;

	protected abstract walkSetTransactionSnapshotCommandNode(node: SetTransactionSnapshotCommandNode): void;

	protected abstract walkSimpleColumnReferenceNode(node: SimpleColumnReferenceNode): void;

	protected abstract walkSubscriptNode(node: SubscriptNode): void;

	protected abstract walkSubSelectNode(node: SubSelectNode): void;

	protected abstract walkTableReferenceNode(node: TableReferenceNode): void;

	protected abstract walkTransactionModeNode(node: TransactionModeNode): void;

	protected abstract walkUnaryOperationNode(node: UnaryOperationNode): void;

	protected abstract walkUpdateCommandNode(node: UpdateCommandNode): void;

	protected abstract walkWithNode(node: WithNode): void;

	protected walkNodes(nodes: AstNode[]): void {
		for (const node of nodes) {
			this.walk(node);
		}
	}

	protected walk(node: AstNode): void {
		switch (node.type) {
			case "aliasedExpressionNode":
				this.walkAliasedExpressionNode(node);
				break;
			case "arrayConstructorNode":
				this.walkArrayConstructorNode(node);
				break;
			case "beginCommandNode":
				this.walkBeginCommandNode(node);
				break;
			case "binaryOperationNode":
				this.walkBinaryOperationNode(node);
				break;
			case "booleanExpressionGroupNode":
				this.walkBooleanExpressionGroupNode(node);
				break;
			case "castNode":
				this.walkCastNode(node);
				break;
			case "columnReferenceNode":
				this.walkColumnReferenceNode(node);
				break;
			case "commitCommandNode":
				this.walkCommitCommandNode(node);
				break;
			case "constantNode":
				this.walkConstantNode(node);
				break;
			case "deleteCommandNode":
				this.walkDeleteCommandNode(node);
				break;
			case "expressionListNode":
				this.walkExpressionListNode(node);
				break;
			case "functionExpressionNode":
				this.walkFunctionExpressionNode(node);
				break;
			case "groupByExpressionNode":
				this.walkGroupByExpressionNode(node);
				break;
			case "insertCommandNode":
				this.walkInsertCommandNode(node);
				break;
			case "joinNode":
				this.walkJoinNode(node);
				break;
			case "limitOffsetNode":
				this.walkLimitOffsetNode(node);
				break;
			case "literalNode":
				this.walkLiteralNode(node);
				break;
			case "naturalSyntaxFunctionExpressionNode":
				this.walkNaturalSyntaxFunctionExpressionNode(node);
				break;
			case "notExpressionNode":
				this.walkNotExpressionNode(node);
				break;
			case "onConflictDoNothingNode":
				this.walkOnConflictDoNothingNode(node);
				break;
			case "onConflictDoUpdateNode":
				this.walkOnConflictDoUpdateNode(node);
				break;
			case "onConflictNode":
				this.walkOnConflictNode(node);
				break;
			case "onConflictTargetIndexesNode":
				this.walkOnConflictTargetIndexesNode(node);
				break;
			case "onConflictTargetIndexNode":
				this.walkOnConflictTargetIndexNode(node);
				break;
			case "onConflictTargetOnConstraintNode":
				this.walkOnConflictTargetOnConstraintNode(node);
				break;
			case "orderByExpressionNode":
				this.walkOrderByExpressionNode(node);
				break;
			case "releaseSavepointCommandNode":
				this.walkReleaseSavepointCommandNode(node);
				break;
			case "rollbackCommandNode":
				this.walkRollbackCommandNode(node);
				break;
			case "rollbackToSavepointCommandNode":
				this.walkRollbackToSavepointCommandNode(node);
				break;
			case "rowConstructorNode":
				this.walkRowConstructorNode(node);
				break;
			case "savepointCommandNode":
				this.walkSavepointCommandNode(node);
				break;
			case "selectCommandNode":
				this.walkSelectCommandNode(node);
				break;
			case "setItemNode":
				this.walkSetItemNode(node);
				break;
			case "selectLockingNode":
				this.walkSelectLockingNode(node);
				break;
			case "setSessionsCharacteristicsAsTransactionCommandNode":
				this.walkSetSessionsCharacteristicsAsTransactionCommandNode(node);
				break;
			case "setTransactionCommandNode":
				this.walkSetTransactionCommandNode(node);
				break;
			case "setTransactionSnapshotCommandNode":
				this.walkSetTransactionSnapshotCommandNode(node);
				break;
			case "simpleColumnReferenceNode":
				this.walkSimpleColumnReferenceNode(node);
				break;
			case "subscriptNode":
				this.walkSubscriptNode(node);
				break;
			case "subSelectNode":
				this.walkSubSelectNode(node);
				break;
			case "tableReferenceNode":
				this.walkTableReferenceNode(node);
				break;
			case "transactionModeNode":
				this.walkTransactionModeNode(node);
				break;
			case "unaryOperationNode":
				this.walkUnaryOperationNode(node);
				break;
			case "updateCommandNode":
				this.walkUpdateCommandNode(node);
				break;
			case "withNode":
				this.walkWithNode(node);
				break;
			default:
				return assertNever(node);
		}
	}
}

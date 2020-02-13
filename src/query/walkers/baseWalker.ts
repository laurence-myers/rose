import {
	AnyAliasedExpressionNode,
	AstNode,
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
import { assertNever } from "../../lang";

export abstract class BaseWalker {

	protected doItemWalk<N extends AstNode>() {
		return (node: N): void => {
			this.walk(node);
		};
	}

	protected abstract walkAliasedExpressionNode(node: AnyAliasedExpressionNode): void;

	protected abstract walkBinaryOperationNode(node: BinaryOperationNode): void;

	protected abstract walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void;

	protected abstract walkColumnReferenceNode(node: ColumnReferenceNode): void;

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

	protected abstract walkOrderByExpressionNode(node: OrderByExpressionNode): void;

	protected abstract walkSelectCommandNode(node: SelectCommandNode): void;

	protected abstract walkSimpleColumnReferenceNode(node: SimpleColumnReferenceNode): void;

	protected abstract walkSetItemNode(node: SetItemNode): void;

	protected abstract walkSubSelectNode(node: SubSelectNode): void;

	protected abstract walkTableReferenceNode(node: TableReferenceNode): void;

	protected abstract walkUnaryOperationNode(node: UnaryOperationNode): void;

	protected abstract walkUpdateCommandNode(node: UpdateCommandNode): void;

	protected abstract walkWithNode(node: WithNode): void;

	protected walk(node: AstNode): void {
		switch (node.type) {
			case "aliasedExpressionNode":
				this.walkAliasedExpressionNode(node);
				break;
			case "binaryOperationNode":
				this.walkBinaryOperationNode(node);
				break;
			case "booleanExpressionGroupNode":
				this.walkBooleanExpressionGroupNode(node);
				break;
			case "columnReferenceNode":
				this.walkColumnReferenceNode(node);
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
			case "orderByExpressionNode":
				this.walkOrderByExpressionNode(node);
				break;
			case "selectCommandNode":
				this.walkSelectCommandNode(node);
				break;
			case "setItemNode":
				this.walkSetItemNode(node);
				break;
			case "simpleColumnReferenceNode":
				this.walkSimpleColumnReferenceNode(node);
				break;
			case "subSelectNode":
				this.walkSubSelectNode(node);
				break;
			case "tableReferenceNode":
				this.walkTableReferenceNode(node);
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

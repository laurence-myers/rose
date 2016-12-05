import {
	SelectCommandNode, AstNode, ColumnReferenceNode, ValueExpressionNode, FromItemNode,
	BooleanExpression, ConstantNode, OrderByExpressionNode, FunctionExpressionNode, LimitOffsetNode,
	AliasedExpressionNode, JoinNode, BooleanBinaryOperationNode, BinaryOperationNode, UnaryOperationNode
} from "./ast";
import {DefaultMap, assertNever, remove, difference, deepFreeze} from "../lang";
import {GeneratedQuery} from "./dsl";
import {UnsupportedOperationError} from "../errors";

export abstract class BaseWalker {

	protected doItemWalk<N extends AstNode>() {
		return (node : N) : void => {
			this.walk(node);
		};
	}

	protected abstract walkAliasedExpressionNode(node : AliasedExpressionNode) : void;

	protected abstract walkBinaryOperationNode(node : BinaryOperationNode) : void;

	protected abstract walkColumnReferenceNode(node : ColumnReferenceNode) : void;

	protected abstract walkConstantNode(node : ConstantNode<any>) : void;

	protected abstract walkFromItemNode(node : FromItemNode) : void;

	protected abstract walkFunctionExpressionNode(node : FunctionExpressionNode) : void;

	protected abstract walkJoinNode(node : JoinNode) : void;

	protected abstract walkLimitOffsetNode(node : LimitOffsetNode) : void;

	protected abstract walkOrderByExpressionNode(node : OrderByExpressionNode) : void;

	protected abstract walkSelectCommandNode(node : SelectCommandNode) : void;

	protected abstract walkUnaryOperationNode(node : UnaryOperationNode) : void;

	protected walk(node : AstNode) : void {
		switch (node.type) {
			case "aliasedExpressionNode":
				this.walkAliasedExpressionNode(node);
				break;
			case "binaryOperationNode":
				this.walkBinaryOperationNode(node);
				break;
			case "columnReferenceNode":
				this.walkColumnReferenceNode(node);
				break;
			case "constantNode":
				this.walkConstantNode(node);
				break;
			case "fromItemNode":
				this.walkFromItemNode(node);
				break;
			case "functionExpressionNode":
				this.walkFunctionExpressionNode(node);
				break;
			case "joinNode":
				this.walkJoinNode(node);
				break;
			case "limitOffsetNode":
				this.walkLimitOffsetNode(node);
				break;
			case "orderByExpressionNode":
				this.walkOrderByExpressionNode(node);
				break;
			case "selectCommandNode":
				this.walkSelectCommandNode(node);
				break;
			case "unaryOperationNode":
				this.walkUnaryOperationNode(node);
				break;
			default:
				return assertNever(node);
		}
	}
}

/**
 * Walks through the AST graph without performing any actions.
 * Extend this class to implement your own behaviour, such as static analysis.
 */
export class SkippingWalker extends BaseWalker {
	protected walkAliasedExpressionNode(node : AliasedExpressionNode) : void {
		this.walk(node.expression);
	}

	protected walkBinaryOperationNode(node : BinaryOperationNode) : void {
		this.walk(node.left);
		this.walk(node.right);
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
	}

	protected walkConstantNode(node : ConstantNode<any>) : void {
	}

	protected walkFromItemNode(node : FromItemNode) : void {
	}

	protected walkFunctionExpressionNode(node : FunctionExpressionNode) : void {
		node.arguments.forEach(this.doItemWalk());
	}

	protected walkLimitOffsetNode(node : LimitOffsetNode) : void {
	}

	protected walkJoinNode(node : JoinNode) : void {
		this.walk(node.fromItem);
		if (node.on) {
			this.walk(node.on);
		}
		if (node.using) {
			node.using.forEach(this.doItemWalk());
		}
	}

	protected walkOrderByExpressionNode(node : OrderByExpressionNode) : void {
		this.walk(node.expression);
	}

	protected walkSelectCommandNode(node : SelectCommandNode) : void {
		node.outputExpressions.forEach(this.doItemWalk());
		node.fromItems.forEach(this.doItemWalk());
		node.joins.forEach(this.doItemWalk());
		node.conditions.forEach(this.doItemWalk());
		node.ordering.forEach(this.doItemWalk());
	}

	protected walkUnaryOperationNode(node : UnaryOperationNode) : void {
		this.walk(node.expression);
	}
}

export interface AnalysisResult {
	tables : string[];
}

export class AnalysingWalker extends SkippingWalker {
	private referencedTables : Set<string> = new Set<string>();
	private specifiedTables : Set<string> = new Set<string>();

	constructor(
		private ast : AstNode
	) {
		super();
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		this.referencedTables.add(node.tableName);
		super.walkColumnReferenceNode(node);
	}

	// TODO: don't screw up sub-queries
	// TODO: don't screw up manually aliased tables?
	protected walkFromItemNode(node : FromItemNode) : void {
		this.specifiedTables.add(node.tableName);
		super.walkFromItemNode(node);
	}

	analyse() : AnalysisResult {
		this.walk(this.ast);
		const unspecifiedTables = difference(this.referencedTables, this.specifiedTables);
		return {
			tables: [...unspecifiedTables]
		};
	}
}

const JOIN_TEXT_MAP = deepFreeze(new Map([
	['inner', 'INNER'],
	['left', 'LEFT OUTER'],
	['right', 'RIGHT OUTER'],
	['full', 'FULL OUTER'],
	['cross', 'CROSS']
]));

export class SqlAstWalker extends BaseWalker {
	// protected tableMap = new DefaultMap<string, string>((key) => `t${ this.queryAst.fromItems.length + 1 }`);
	protected sb : string[] = [];
	protected parameterValues : any[] = [];

	constructor(
		protected queryAst : SelectCommandNode,
		protected tableMap : DefaultMap<string, string>,
		protected params : Object
	) {
		super();
	}

	protected doListWalk<N extends AstNode>() {
		return (node : N, index : number) : void => {
			if (index > 0) {
				this.sb.push(`, `);
			}
			this.walk(node);
		}
	}

	protected walkAliasedExpressionNode(node : AliasedExpressionNode) : void {
		this.walk(node.expression);
		this.sb.push(` as "`);
		this.sb.push(node.alias);
		this.sb.push(`"`);
	}

	protected walkBinaryOperationNode(node : BinaryOperationNode) : void {
		this.walk(node.left);
		this.sb.push(` `);
		this.sb.push(node.operator);
		this.sb.push(` `);
		this.walk(node.right);
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		const tableAlias = this.tableMap.get(node.tableName);
		this.sb.push(`"`);
		this.sb.push(tableAlias);
		this.sb.push(`"."`);
		this.sb.push(node.columnName);
		this.sb.push(`"`);
	}

	protected walkConstantNode(node : ConstantNode<any>) : void {
		const value = node.getter(this.params);
		this.parameterValues.push(value);
		this.sb.push(`$`);
		this.sb.push(this.parameterValues.length.toString());
	}

	protected walkFromItemNode(node : FromItemNode) : void {
		this.sb.push(`"`);
		this.sb.push(node.tableName);
		this.sb.push(`" as "`);
		this.sb.push(node.alias);
		this.sb.push(`"`);
	}

	protected walkJoinNode(node : JoinNode) : void {
		const joinText = JOIN_TEXT_MAP.get(node.joinType);
		if (!joinText) {
			throw new UnsupportedOperationError(`Unrecognised join type: ${ node.joinType }`);
		}
		if (node.joinType == 'cross' && (node.on || (node.using && node.using.length > 0))) {
			throw new UnsupportedOperationError(`Cross joins cannot specify "on" or "using" conditions.`);
		}
		if (node.on && node.using && node.using.length > 0) {
			throw new UnsupportedOperationError(`Joins cannot specify both "on" and "using" conditions.`);
		}

		this.sb.push(joinText);
		this.sb.push(` JOIN `);
		this.walk(node.fromItem);
		if (node.on) {
			this.sb.push(` ON `);
			this.walk(node.on);
		} else if (node.using) {
			this.sb.push(` USING `);
			node.using.forEach(this.doListWalk());
		}
		// TODO: support "natural"
	}

	protected walkFunctionExpressionNode(node : FunctionExpressionNode) : void {
		this.sb.push(node.name);
		this.sb.push('(');
		if (node.arguments.length > 0) {
			node.arguments.forEach(this.doItemWalk());
		} else {
			this.sb.push('*');
		}
		this.sb.push(')');
	}

	protected walkLimitOffsetNode(node : LimitOffsetNode) : void {
		this.sb.push('LIMIT ');
		this.walk(node.limit);
		this.sb.push(' OFFSET ');
		this.walk(node.offset);
	}

	protected walkOrderByExpressionNode(node : OrderByExpressionNode) : void {
		this.walk(node.expression);
		if (node.order) {
			switch (node.order) {
				case 'asc':
					this.sb.push(' ASC');
					break;
				case 'desc':
					this.sb.push(' DESC');
					break;
				case 'using':
					this.sb.push(' USING ');
					if (!node.operator) {
						throw new UnsupportedOperationError(`An order by expression with "using" must also have an operator.`);
					}
					this.sb.push(node.operator);
					break;
				default:
					return assertNever(node.order);
			}
		}
	}

	protected walkSelectCommandNode(node : SelectCommandNode) : void {
		this.sb.push("SELECT ");
		if (node.distinction == 'distinct') {
			this.sb.push("DISTINCT ");
		}
		node.outputExpressions.forEach(this.doListWalk());
		this.sb.push(" FROM ");
		node.fromItems.forEach(this.doListWalk());
		if (node.conditions.length > 0) {
			this.sb.push(" WHERE (");
			node.conditions.forEach(this.doItemWalk());
			this.sb.push(")");
		}
		if (node.joins.length > 0) {
			this.sb.push(" ");
			node.joins.forEach(this.doListWalk());
		}
		if (node.ordering.length > 0) {
			this.sb.push(" ORDER BY ");
			node.ordering.forEach(this.doItemWalk());
		}
		if (node.limit) {
			this.sb.push(" ");
			this.walk(node.limit);
		}
	}

	protected walkUnaryOperationNode(node : UnaryOperationNode) : void {
		if (node.position == 'left') {
			this.sb.push(node.operator);
			this.sb.push(` `);
			this.walk(node.expression);
		} else {
			this.walk(node.expression);
			this.sb.push(` `);
			this.sb.push(node.operator);
		}
	}

	toSql() : GeneratedQuery {
		// console.log(this.tableMap);
		// console.dir(this.queryAst, { depth: null });
		this.walk(this.queryAst);
		return {
			sql: this.sb.join(''),
			parameters: this.parameterValues
		};
	}
}

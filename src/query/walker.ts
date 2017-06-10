import {
	SelectCommandNode, AstNode, ColumnReferenceNode, ValueExpressionNode, FromItemNode,
	BooleanExpression, ConstantNode, OrderByExpressionNode, FunctionExpressionNode, LimitOffsetNode,
	AliasedExpressionNode, JoinNode, BooleanBinaryOperationNode, BinaryOperationNode, UnaryOperationNode,
	BooleanExpressionGroupNode, NotExpressionNode, SubSelectNode, NaturalSyntaxFunctionExpressionNode, LiteralNode
} from "./ast";
import {DefaultMap, assertNever, remove, difference, deepFreeze, keySet} from "../lang";
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

	protected abstract walkBooleanExpressionGroupNode(node : BooleanExpressionGroupNode) : void;

	protected abstract walkColumnReferenceNode(node : ColumnReferenceNode) : void;

	protected abstract walkConstantNode(node : ConstantNode<any>) : void;

	protected abstract walkFromItemNode(node : FromItemNode) : void;

	protected abstract walkFunctionExpressionNode(node : FunctionExpressionNode) : void;

	protected abstract walkJoinNode(node : JoinNode) : void;

	protected abstract walkLimitOffsetNode(node : LimitOffsetNode) : void;

	protected abstract walkLiteralNode(node : LiteralNode) : void;

	protected abstract walkNaturalSyntaxFunctionExpressionNode(node : NaturalSyntaxFunctionExpressionNode) : void;

	protected abstract walkNotExpressionNode(node : NotExpressionNode) : void;

	protected abstract walkOrderByExpressionNode(node : OrderByExpressionNode) : void;

	protected abstract walkSelectCommandNode(node : SelectCommandNode) : void;

	protected abstract walkSubSelectNode(node : SubSelectNode) : void;

	protected abstract walkUnaryOperationNode(node : UnaryOperationNode) : void;

	protected walk(node : AstNode) : void {
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
			case "subSelectNode":
				this.walkSubSelectNode(node);
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

	protected walkBooleanExpressionGroupNode(node : BooleanExpressionGroupNode) : void {
		node.expressions.forEach(this.doItemWalk());
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

	protected walkLiteralNode(node : LiteralNode) : void {
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

	protected walkNaturalSyntaxFunctionExpressionNode(node : NaturalSyntaxFunctionExpressionNode) : void {
		node.arguments.map((node) => node.value)
			.forEach(this.doItemWalk());
	}

	protected walkNotExpressionNode(node : NotExpressionNode) : void {
		this.walk(node.expression);
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

	protected walkSubSelectNode(node : SubSelectNode) : void {
		this.walk(node.query);
	}

	protected walkUnaryOperationNode(node : UnaryOperationNode) : void {
		this.walk(node.expression);
	}
}

export class RectifyingWalker extends SkippingWalker {
	protected referencedTables : Set<string> = new Set<string>();
	protected specifiedTables : Set<string> = new Set<string>();

	constructor(
		protected ast : SelectCommandNode,
		protected tableMap : DefaultMap<string, string> = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`)
	) {
		super();
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		this.referencedTables.add(node.tableName);
		super.walkColumnReferenceNode(node);
	}

	protected walkFromItemNode(node : FromItemNode) : void {
		this.specifiedTables.add(node.tableName);
		super.walkFromItemNode(node);
	}

	protected walkSubSelectNode(node : SubSelectNode) : void {
		const subWalker = new RectifyingWalker(node.query, this.tableMap);
		subWalker.rectify();
	}

	rectify() : void {
		this.walk(this.ast);
		const unspecifiedTables = difference(this.referencedTables, this.specifiedTables);
		unspecifiedTables.forEach((tableName) => {
			const tableAlias = this.tableMap.get(tableName);

			this.ast.fromItems.push({
				type: 'fromItemNode',
				tableName: tableName,
				alias: tableAlias
			});
		});
	}
}

const JOIN_TEXT_MAP = deepFreeze(new Map([
	['inner', 'INNER'],
	['left', 'LEFT OUTER'],
	['right', 'RIGHT OUTER'],
	['full', 'FULL OUTER'],
	['cross', 'CROSS']
]));

const BOOLEAN_EXPRESSION_GROUP_OPERATOR_MAP = deepFreeze(new Map([
	['and', 'AND'],
	['or', 'OR']
]));

export class SqlAstWalker extends BaseWalker {
	protected sb : string[] = [];
	protected parameterGetters : Array<(p : Object) => any> = [];

	constructor(
		protected queryAst : SelectCommandNode,
		protected tableMap : DefaultMap<string, string>
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

	protected walkBooleanExpressionGroupNode(node : BooleanExpressionGroupNode) : void {
		const operator = BOOLEAN_EXPRESSION_GROUP_OPERATOR_MAP.get(node.operator);
		if (!operator) {
			throw new UnsupportedOperationError(`Unrecognised boolean expression group operator: "${ node.operator }"`);
		}
		this.sb.push(`(`);
		node.expressions.forEach((node : BooleanExpression, index : number) : void => {
			if (index > 0) {
				this.sb.push(` `);
				this.sb.push(operator);
				this.sb.push(` `);
			}
			this.walk(node);
		});
		this.sb.push(`)`);
	}

	protected walkBinaryOperationNode(node : BinaryOperationNode) : void {
		this.walk(node.left);
		this.sb.push(` `);
		this.sb.push(node.operator);
		this.sb.push(` `);
		this.walk(node.right);
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		const tableAlias = node.tableAlias || this.tableMap.get(node.tableName);
		this.sb.push(`"`);
		this.sb.push(tableAlias);
		this.sb.push(`"."`);
		this.sb.push(node.columnName);
		this.sb.push(`"`);
	}

	protected walkConstantNode(node : ConstantNode<any>) : void {
		this.parameterGetters.push(node.getter);
		this.sb.push(`$`);
		this.sb.push(this.parameterGetters.length.toString());
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
			node.arguments.forEach(this.doListWalk());
		}
		this.sb.push(')');
	}

	protected walkLimitOffsetNode(node : LimitOffsetNode) : void {
		this.sb.push('LIMIT ');
		this.walk(node.limit);
		this.sb.push(' OFFSET ');
		this.walk(node.offset);
	}

	protected walkLiteralNode(node : LiteralNode) : void {
		this.sb.push(node.value);
	}

	protected walkNaturalSyntaxFunctionExpressionNode(node : NaturalSyntaxFunctionExpressionNode) : void {
		this.sb.push(node.name);
		this.sb.push('(');
		if (node.arguments.length > 0) {
			node.arguments.forEach((arg, index) => {
				if (arg.key) {
					this.sb.push(arg.key);
					this.sb.push(' ');
				}
				this.walk(arg.value);
				if (index < node.arguments.length - 1) {
					this.sb.push(" ");
				}
			});
		}
		this.sb.push(')');
	}

	protected walkNotExpressionNode(node : NotExpressionNode) : void {
		this.sb.push(`NOT (`);
		this.walk(node.expression);
		this.sb.push(`)`);
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
		if (node.fromItems.length > 0) {
			this.sb.push(" FROM ");
			node.fromItems.forEach(this.doListWalk());
		}
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

	protected walkSubSelectNode(node : SubSelectNode) : void {
		this.sb.push(`(`);
		this.walk(node.query);
		this.sb.push(`)`);
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

	prepare() : PreparedQueryData {
		this.walk(this.queryAst);
		return {
			sql: this.sb.join(''),
			parameterGetters: this.parameterGetters
		};
	}
}

interface PreparedQueryData {
	sql : string;
	parameterGetters : Array<(params : Object) => any>;
}

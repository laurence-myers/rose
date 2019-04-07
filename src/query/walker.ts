import {
	AnyAliasedExpressionNode,
	AstNode,
	BinaryOperationNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
	ConstantNode,
	ExpressionListNode,
	FunctionExpressionNode,
	GroupByExpressionNode,
	JoinNode,
	LimitOffsetNode,
	LiteralNode,
	NaturalSyntaxFunctionExpressionNode,
	NotExpressionNode,
	OrderByExpressionNode,
	SelectCommandNode,
	SubSelectNode,
	TableReferenceNode,
	UnaryOperationNode,
	WithNode
} from "./ast";
import {assertNever, deepFreeze, DefaultMap, difference} from "../lang";
import {UnsupportedOperationError} from "../errors";

export abstract class BaseWalker {

	protected doItemWalk<N extends AstNode>() {
		return (node : N) : void => {
			this.walk(node);
		};
	}

	protected abstract walkAliasedExpressionNode(node : AnyAliasedExpressionNode) : void;

	protected abstract walkBinaryOperationNode(node : BinaryOperationNode) : void;

	protected abstract walkBooleanExpressionGroupNode(node : BooleanExpressionGroupNode) : void;

	protected abstract walkColumnReferenceNode(node : ColumnReferenceNode) : void;

	protected abstract walkConstantNode(node : ConstantNode<any>) : void;

	protected abstract walkExpressionListNode(node : ExpressionListNode) : void;

	protected abstract walkFunctionExpressionNode(node : FunctionExpressionNode) : void;

	protected abstract walkGroupByExpressionNode(node : GroupByExpressionNode) : void;

	protected abstract walkJoinNode(node : JoinNode) : void;

	protected abstract walkLimitOffsetNode(node : LimitOffsetNode) : void;

	protected abstract walkLiteralNode(node : LiteralNode) : void;

	protected abstract walkNaturalSyntaxFunctionExpressionNode(node : NaturalSyntaxFunctionExpressionNode) : void;

	protected abstract walkNotExpressionNode(node : NotExpressionNode) : void;

	protected abstract walkOrderByExpressionNode(node : OrderByExpressionNode) : void;

	protected abstract walkSelectCommandNode(node : SelectCommandNode) : void;

	protected abstract walkSubSelectNode(node : SubSelectNode) : void;

	protected abstract walkTableReferenceNode(node : TableReferenceNode) : void;

	protected abstract walkUnaryOperationNode(node : UnaryOperationNode) : void;

	protected abstract walkWithNode(node : WithNode) : void;

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
			case "expressionListNode":
				this.walkExpressionListNode(node);
				break;
			case "functionExpressionNode":
				this.walkFunctionExpressionNode(node);
				break;
			case "groupByExpressionNode":
				this.walkGroupByExpressionNode(node);
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
			case "tableReferenceNode":
				this.walkTableReferenceNode(node);
				break;
			case "unaryOperationNode":
				this.walkUnaryOperationNode(node);
				break;
			case "withNode":
				this.walkWithNode(node);
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
	protected walkAliasedExpressionNode(node : AnyAliasedExpressionNode) : void {
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

	protected walkExpressionListNode(node : ExpressionListNode) : void {
		node.expressions.forEach(this.doItemWalk());
	}

	protected walkFunctionExpressionNode(node : FunctionExpressionNode) : void {
		node.arguments.forEach(this.doItemWalk());
	}

	protected walkGroupByExpressionNode(node : GroupByExpressionNode) : void {
		this.walk(node.expression);
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
		node.grouping.forEach(this.doItemWalk());
	}

	protected walkSubSelectNode(node : SubSelectNode) : void {
		this.walk(node.query);
	}

	protected walkTableReferenceNode(node : TableReferenceNode) : void {
	}

	protected walkUnaryOperationNode(node : UnaryOperationNode) : void {
		this.walk(node.expression);
	}

	protected walkWithNode(node : WithNode) : void {
		node.selectNodes.forEach(this.doItemWalk());
	}
}

export class RectifyingWalker extends SkippingWalker {
	protected referencedTables : Set<string> = new Set<string>();
	protected specifiedTables : Set<string> = new Set<string>();
	protected columnReferences : Set<ColumnReferenceNode> = new Set<ColumnReferenceNode>();

	constructor(
		protected ast : SelectCommandNode,
		protected tableMap : DefaultMap<string, string> = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`)
	) {
		super();
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		this.referencedTables.add(node.tableName);
		this.columnReferences.add(node);
		super.walkColumnReferenceNode(node);
	}

	protected walkSubSelectNode(node : SubSelectNode) : void {
		const subWalker = new RectifyingWalker(node.query, this.tableMap);
		subWalker.rectify();
	}

	protected walkTableReferenceNode(node : TableReferenceNode) : void {
		this.specifiedTables.add(node.tableName);
		super.walkTableReferenceNode(node);
	}

	protected walkWithNode(node : WithNode) : void {
		// Do not process sub-nodes, they should be self-contained
	}

	rectify() : void {
		this.walk(this.ast);
		const unspecifiedTables = difference(this.referencedTables, this.specifiedTables);
		unspecifiedTables.forEach((tableName) => {
			const tableAlias = this.tableMap.get(tableName);
			this.ast.fromItems.push({
				type: "aliasedExpressionNode",
				alias: tableAlias,
				aliasPath: [tableAlias],
				expression: {
					type: "tableReferenceNode",
					tableName,
				}
			});
		});
		// Update all column references to use the aliases.
		for (const column of this.columnReferences.values()) {
			if (!column.tableAlias) {
				const tableAlias = this.tableMap.get(column.tableName);
				column.tableAlias = tableAlias;
			}
		}
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
	protected sb : string = '';
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
				this.sb += `, `;
			}
			this.walk(node);
		}
	}

	protected walkAliasedExpressionNode(node : AnyAliasedExpressionNode) : void {
		this.walk(node.expression);
		this.sb += ` as "`;
		this.sb += node.alias;
		this.sb += `"`;
	}

	protected walkBooleanExpressionGroupNode(node : BooleanExpressionGroupNode) : void {
		const operator = BOOLEAN_EXPRESSION_GROUP_OPERATOR_MAP.get(node.operator);
		if (!operator) {
			throw new UnsupportedOperationError(`Unrecognised boolean expression group operator: "${ node.operator }"`);
		}
		this.sb += `(`;
		node.expressions.forEach((node : BooleanExpression, index : number) : void => {
			if (index > 0) {
				this.sb += ` `;
				this.sb += operator;
				this.sb += ` `;
			}
			this.walk(node);
		});
		this.sb += `)`;
	}

	protected walkBinaryOperationNode(node : BinaryOperationNode) : void {
		this.walk(node.left);
		this.sb += ` `;
		this.sb += node.operator;
		this.sb += ` `;
		this.walk(node.right);
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		const tableAlias = node.tableAlias || this.tableMap.get(node.tableName);
		this.sb += `"`;
		this.sb += tableAlias;
		this.sb += `"."`;
		this.sb += node.columnName;
		this.sb += `"`;
	}

	protected walkConstantNode(node : ConstantNode<any>) : void {
		this.parameterGetters.push(node.getter);
		this.sb += `$`;
		this.sb += this.parameterGetters.length.toString();
	}

	protected walkExpressionListNode(node : ExpressionListNode) : void {
		this.sb += '(';
		node.expressions.forEach(this.doListWalk());
		this.sb += ')';
	}

	protected walkGroupByExpressionNode(node : GroupByExpressionNode) : void {
		this.walk(node.expression);
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

		this.sb += joinText;
		this.sb += ` JOIN `;
		this.walk(node.fromItem);
		if (node.on) {
			this.sb += ` ON `;
			this.walk(node.on);
		} else if (node.using) {
			this.sb += ` USING `;
			node.using.forEach(this.doListWalk());
		}
		// TODO: support "natural"
	}

	protected walkFunctionExpressionNode(node : FunctionExpressionNode) : void {
		this.sb += node.name;
		this.sb += '(';
		if (node.arguments.length > 0) {
			node.arguments.forEach(this.doListWalk());
		}
		this.sb += ')';
	}

	protected walkLimitOffsetNode(node : LimitOffsetNode) : void {
		this.sb += 'LIMIT ';
		this.walk(node.limit);
		// TODO: decouple limit and offset nodes
		this.sb += ' OFFSET ';
		this.walk(node.offset);
	}

	protected walkLiteralNode(node : LiteralNode) : void {
		this.sb += node.value;
	}

	protected walkNaturalSyntaxFunctionExpressionNode(node : NaturalSyntaxFunctionExpressionNode) : void {
		this.sb += node.name;
		this.sb += '(';
		if (node.arguments.length > 0) {
			node.arguments.forEach((arg, index) => {
				if (arg.key) {
					this.sb += arg.key;
					this.sb += ' ';
				}
				this.walk(arg.value);
				if (index < node.arguments.length - 1) {
					this.sb += " ";
				}
			});
		}
		this.sb += ')';
	}

	protected walkNotExpressionNode(node : NotExpressionNode) : void {
		this.sb += `NOT (`;
		this.walk(node.expression);
		this.sb += `)`;
	}

	protected walkOrderByExpressionNode(node : OrderByExpressionNode) : void {
		this.walk(node.expression);
		if (node.order) {
			switch (node.order) {
				case 'asc':
					this.sb += ' ASC';
					break;
				case 'desc':
					this.sb += ' DESC';
					break;
				case 'using':
					this.sb += ' USING ';
					if (!node.operator) {
						throw new UnsupportedOperationError(`An order by expression with "using" must also have an operator.`);
					}
					this.sb += node.operator;
					break;
				default:
					return assertNever(node.order);
			}
		}
	}

	protected walkSelectCommandNode(node : SelectCommandNode) : void {
		if (node.with) {
			this.walk(node.with);
		}
		this.sb += "SELECT ";
		switch (node.distinction) {
			case "distinct":
				this.sb += "DISTINCT ";
				break;
			case "all":
				break;
			case "on":
				this.sb += "DISTINCT ON (";
				if (node.distinctOn) {
					this.walk(node.distinctOn);
				} else {
					throw new UnsupportedOperationError(`When using "distinct on", you must provide a distinctOn expression.`);
				}
				this.sb += ") ";
				break;
			default:
				assertNever(node.distinction);
		}
		node.outputExpressions.forEach(this.doListWalk());
		if (node.fromItems.length > 0) {
			this.sb += " FROM ";
			node.fromItems.forEach(this.doListWalk());
		}
		if (node.joins.length > 0) {
			this.sb += " ";
			node.joins.forEach(this.doItemWalk());
		}
		if (node.conditions.length > 0) {
			this.sb += " WHERE ";
			node.conditions.forEach(this.doItemWalk());
		}
		if (node.grouping.length > 0) {
			this.sb += " GROUP BY (";
			node.grouping.forEach(this.doListWalk());
			this.sb += ")";
		}
		if (node.ordering.length > 0) {
			this.sb += " ORDER BY ";
			node.ordering.forEach(this.doListWalk());
		}
		if (node.limit) {
			this.sb += " ";
			this.walk(node.limit);
		}
	}

	protected walkSubSelectNode(node : SubSelectNode) : void {
		this.sb += `(`;
		this.walk(node.query);
		this.sb += `)`;
	}

	protected walkTableReferenceNode(node : TableReferenceNode) : void {
		this.sb += `"`;
		this.sb += node.tableName;
		this.sb += `"`;
	}

	protected walkUnaryOperationNode(node : UnaryOperationNode) : void {
		if (node.position == 'left') {
			this.sb += node.operator;
			this.sb += ` `;
			this.walk(node.expression);
		} else {
			this.walk(node.expression);
			this.sb += ` `;
			this.sb += node.operator;
		}
	}

	protected walkWithNode(node : WithNode) : void {
		if (node.selectNodes.length > 0) {
			this.sb += `WITH `;
			for (let i = 0; i < node.selectNodes.length; i++) {
				const selectNode = node.selectNodes[i];
				if (i > 0) {
					this.sb += `, `;
				}
				// We can't use the normal alias expression walker, because CTEs specify the alias before the expression.
				this.sb += `"`;
				this.sb += selectNode.alias;
				this.sb += `" as `;
				this.walk(selectNode.expression);
			}
			this.sb += ` `;
		}
	}

	prepare() : PreparedQueryData {
		this.walk(this.queryAst);
		return {
			sql: this.sb,
			parameterGetters: this.parameterGetters
		};
	}
}

interface PreparedQueryData {
	sql : string;
	parameterGetters : Array<(params : Object) => any>;
}

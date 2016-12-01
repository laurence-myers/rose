import {
	SelectCommandNode, AstNode, ColumnReferenceNode, ValueExpressionNode, FromItemNode,
	BooleanExpressionNode, ConstantNode, OrderByExpressionNode, FunctionExpressionNode, LimitOffsetNode,
	AliasedExpressionNode
} from "./ast";
import {DefaultMap, assertNever, remove} from "../lang";
import {GeneratedQuery} from "./dsl";
import {UnsupportedOperationError} from "../errors";

export abstract class BaseWalker {

	protected abstract walkAliasedExpressionNode(node : AliasedExpressionNode) : void;

	protected abstract walkBooleanExpressionNode(node : BooleanExpressionNode) : void;

	protected abstract walkColumnReferenceNode(node : ColumnReferenceNode) : void;

	protected abstract walkConstantNode(node : ConstantNode<any>) : void;

	protected abstract walkFromItemNode(node : FromItemNode) : void;

	protected abstract walkFunctionExpressionNode(node : FunctionExpressionNode) : void;

	protected abstract walkLimitOffsetNode(node : LimitOffsetNode) : void;

	protected abstract walkOrderByExpressionNode(node : OrderByExpressionNode) : void;

	protected abstract walkSelectCommandNode(node : SelectCommandNode) : void;

	protected walk(node : AstNode) : void {
		switch (node.type) {
			case "aliasedExpressionNode":
				this.walkAliasedExpressionNode(node);
				break;
			case "booleanExpressionNode":
				this.walkBooleanExpressionNode(node);
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
			case "limitOffsetNode":
				this.walkLimitOffsetNode(node);
				break;
			case "orderByExpressionNode":
				this.walkOrderByExpressionNode(node);
				break;
			case "selectCommandNode":
				this.walkSelectCommandNode(node);
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
	}

	protected walkBooleanExpressionNode(node : BooleanExpressionNode) : void {
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
		node.arguments.forEach((node) => this.walk(node));
	}

	protected walkLimitOffsetNode(node : LimitOffsetNode) : void {
	}

	protected walkOrderByExpressionNode(node : OrderByExpressionNode) : void {
		this.walk(node.expression);
	}

	protected walkSelectCommandNode(node : SelectCommandNode) : void {
		node.outputExpressions.forEach((node) => this.walk(node));
		node.fromItems.forEach((node) => this.walk(node));
		node.conditions.forEach((node) => this.walk(node));
		node.ordering.forEach((node) => this.walk(node));
	}
}

export interface AnalysisResult {
	tables : string[];
}

export class AnalysingWalker extends SkippingWalker {
	private tables : string[] = [];

	constructor(
		private ast : AstNode
	) {
		super();
	}

	protected walkColumnReferenceNode(node : ColumnReferenceNode) : void {
		this.tables.push(node.tableName);
	}

	// TODO: don't screw up sub-queries
	// TODO: don't screw up manually aliased tables?
	protected walkFromItemNode(node : FromItemNode) : void {
		remove(this.tables, node.tableName);
	}

	analyse() : AnalysisResult {
		this.walk(this.ast);
		return {
			tables: this.tables
		};
	}
}

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

	protected walkAliasedExpressionNode(node : AliasedExpressionNode) : void {
		this.walk(node.expression);
		this.sb.push(` as "`);
		this.sb.push(node.alias);
		this.sb.push(`"`);
	}

	protected walkBooleanExpressionNode(node : BooleanExpressionNode) : void {
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
		if (node.alias) {
			this.sb.push(` as "`);
			this.sb.push(node.alias);
			this.sb.push(`"`);
		}
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

	protected walkFunctionExpressionNode(node : FunctionExpressionNode) : void {
		this.sb.push(node.name);
		this.sb.push('(');
		if (node.arguments.length > 0) {
			node.arguments.forEach((node) => this.walk(node));
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
		node.outputExpressions.forEach((node : ValueExpressionNode, index : number) => {
			if (index > 0) {
				this.sb.push(', ');
			}
			this.walk(node);
		});
		this.sb.push(" FROM ");
		node.fromItems.forEach((node : FromItemNode, index : number) => {
			if (index > 0) {
				this.sb.push(', ');
			}
			this.walk(node);
		});
		if (node.conditions.length > 0) {
			this.sb.push(" WHERE (");
			node.conditions.forEach((node : BooleanExpressionNode) => this.walk(node));
			this.sb.push(")");
		}
		if (node.ordering.length > 0) {
			this.sb.push(" ORDER BY ");
			node.ordering.forEach((node : OrderByExpressionNode) => this.walk(node));
		}
		if (node.limit) {
			this.sb.push(" ");
			this.walk(node.limit);
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

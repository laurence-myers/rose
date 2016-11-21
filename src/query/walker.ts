import {
	SelectCommandNode, AstNode, ColumnReferenceNode, ValueExpressionNode, FromItemNode,
	BooleanExpressionNode, ConstantNode
} from "./ast";
import {DefaultMap, assertNever} from "../lang";
import {GeneratedQuery} from "./dsl";

export class AstWalker {
	// protected tableMap = new DefaultMap<string, string>((key) => `t${ this.queryAst.fromItems.length + 1 }`);
	protected sb : string[] = [];
	protected parameterValues : any[] = [];

	constructor(
		protected queryAst : SelectCommandNode,
		protected tableMap : DefaultMap<string, string>,
		protected params : Object
	) {

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
	}

	protected walk(node : AstNode) : void {
		switch (node.type) {
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
			case "selectCommandNode":
				this.walkSelectCommandNode(node);
				break;
			default:
				return assertNever(node);
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
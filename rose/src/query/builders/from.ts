import { QueryTable } from "../metamodel";
import {
	AliasedExpressionNode,
	AliasNode,
	FromItemFunctionNode,
	FromItemNode,
	FromItemSubSelectNode,
	FromItemTableNode,
	FromItemWithNode,
	FunctionExpressionNode,
	ParameterOrValueExpressionNode,
	SubSelectNode,
	TableReferenceNode,
	TableSample,
} from "../ast";
import { AliasedSubQueryBuilder, CommonTableExpressionBuilder } from "./select";
import { Clone, rectifyVariadicArgs } from "../../lang";
import { alias, join } from "../dsl";
import { UnsupportedOperationError } from "../../errors";

export type FromableNode =
	| FunctionExpressionNode
	| FunctionExpressionNode[]
	| TableReferenceNode
	| AliasedExpressionNode<SubSelectNode>;

export type Fromable =
	| CommonTableExpressionBuilder<any>
	| FromItemNode
	| FromableNode
	| QueryTable
	| AliasedSubQueryBuilder<any>;

type ColumnDefinition = [string, string];

export abstract class BaseFromBuilder<TFromItemNode extends FromItemNode> {
	abstract toNode(): TFromItemNode;

	join(other: Fromable) {
		return join(this.toNode(), other);
	}
}

export class FromTableBuilder extends BaseFromBuilder<FromItemTableNode> {
	protected readonly ast: FromItemTableNode;

	constructor(protected readonly table: TableReferenceNode) {
		super();
		this.ast = {
			type: "fromItemTableNode",
			table: table,
		};
	}

	@Clone()
	alias(aliasName: string): this {
		this.ast.alias = alias(aliasName);
		return this;
	}

	columnAliases(columnAliases: readonly string[]): this;
	columnAliases(first: string, ...rest: readonly string[]): this;
	@Clone()
	columnAliases(
		first: readonly string[] | string,
		...rest: readonly string[]
	): this {
		this.ast.columnAliases = rectifyVariadicArgs(first, rest);
		return this;
	}

	@Clone()
	only(isOnly: boolean = true): this {
		this.ast.only = isOnly;
		return this;
	}

	@Clone()
	tableSample(
		samplingMethod: TableSample["samplingMethod"],
		args: ParameterOrValueExpressionNode[],
		repeatableSeed?: ParameterOrValueExpressionNode
	) {
		this.ast.tableSample = {
			samplingMethod,
			arguments: args,
			repeatableSeed,
		};
	}

	toNode(): FromItemTableNode {
		return this.ast;
	}
}

export class FromSubSelectBuilder extends BaseFromBuilder<FromItemSubSelectNode> {
	protected readonly ast: FromItemSubSelectNode;

	constructor(
		protected readonly query: SubSelectNode,
		protected readonly alias: AliasNode
	) {
		super();
		this.ast = {
			type: "fromItemSubSelectNode",
			alias,
			query,
		};
	}

	columnAliases(columnAliases: readonly string[]): this;
	columnAliases(first: string, ...rest: readonly string[]): this;
	@Clone()
	columnAliases(
		first: readonly string[] | string,
		...rest: readonly string[]
	): this {
		this.ast.columnAliases = rectifyVariadicArgs(first, rest);
		return this;
	}

	@Clone()
	lateral(isLateral: boolean = true): this {
		this.ast.lateral = isLateral;
		return this;
	}

	toNode(): FromItemSubSelectNode {
		return this.ast;
	}
}

export class FromWithBuilder extends BaseFromBuilder<FromItemWithNode> {
	protected readonly ast: FromItemWithNode;

	constructor(withQueryName: string) {
		super();
		this.ast = {
			type: "fromItemWithNode",
			withQueryName,
		};
	}

	@Clone()
	alias(aliasName: string): this {
		this.ast.alias = alias(aliasName);
		return this;
	}

	columnAliases(columnAliases: readonly string[]): this;
	columnAliases(first: string, ...rest: readonly string[]): this;
	@Clone()
	columnAliases(
		first: readonly string[] | string,
		...rest: readonly string[]
	): this {
		this.ast.columnAliases = rectifyVariadicArgs(first, rest);
		return this;
	}

	toNode(): FromItemWithNode {
		return this.ast;
	}
}

export class FromFunctionBuilder extends BaseFromBuilder<FromItemFunctionNode> {
	protected readonly ast: FromItemFunctionNode;

	constructor(functionExpressions: FunctionExpressionNode[]) {
		super();
		this.ast = {
			type: "fromItemFunctionNode",
			functionExpressions: functionExpressions.map((node) => ({
				type: "functionExpressionNode",
				functionExpression: node,
			})),
		};
	}

	@Clone()
	alias(aliasName: string): this {
		this.ast.alias = alias(aliasName);
		return this;
	}

	columnAliases(columnAliases: readonly string[]): this;
	columnAliases(first: string, ...rest: readonly string[]): this;
	@Clone()
	columnAliases(
		first: readonly string[] | string,
		...rest: readonly string[]
	): this {
		this.ast.columnAliases = rectifyVariadicArgs(first, rest);
		return this;
	}

	columnDefinitions(columnDefinitions: readonly ColumnDefinition[][]): this;
	columnDefinitions(
		first: ColumnDefinition[],
		...rest: readonly ColumnDefinition[][]
	): this;
	@Clone()
	columnDefinitions(
		first: readonly ColumnDefinition[][] | ColumnDefinition[],
		...rest: readonly ColumnDefinition[][]
	): this {
		// TODO: make it easier to provide column definitions alongside the functions
		const colDefs = rectifyVariadicArgs(first, rest);
		if (colDefs.length !== this.ast.functionExpressions.length) {
			throw new UnsupportedOperationError(
				`The number of column definitions must match the number of functions. Functions: ${this.ast.functionExpressions.length}, Column definitions: ${colDefs.length}`
			);
		}
		for (let i = 0; i < this.ast.functionExpressions.length; i++) {
			const node = this.ast.functionExpressions[i];
			const colDef = colDefs[i];
			node.columnDefinitions = colDef.map(([columnName, dataType]) => ({
				type: "columnDefinitionNode",
				columnName,
				dataType,
			}));
		}
		return this;
	}

	@Clone()
	lateral(isLateral: boolean = true): this {
		this.ast.lateral = isLateral;
		return this;
	}

	@Clone()
	withOrdinality(isWithOrdinality: boolean = true): this {
		this.ast.withOrdinality = isWithOrdinality;
		return this;
	}

	toNode(): FromItemFunctionNode {
		return this.ast;
	}
}

import { QueryTable, TableMetamodel } from "../metamodel";
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
	TableSample,
} from "../ast";
import { AliasedSubQueryBuilder } from "./select";
import { Clone, rectifyVariadicArgs } from "../../lang";
import { alias, join } from "../dsl";
import { UnsupportedOperationError } from "../../errors";
import { BuildableJoin } from "./join";
import { CommonTableExpressionBuilder } from "./with";

export type FromableNode =
	| AliasedExpressionNode<SubSelectNode>
	| FunctionExpressionNode
	| FunctionExpressionNode[];

export type Fromable =
	| AliasedSubQueryBuilder<any>
	| BuildableJoin
	| CommonTableExpressionBuilder
	| FromItemNode
	| FromableNode
	| QueryTable
	| string // table name
	| TableMetamodel;

type ColumnDefinition = [string, string];

export abstract class BaseFromBuilder<TFromItemNode extends FromItemNode> {
	abstract toNode(): TFromItemNode;

	join(other: Fromable) {
		return join(this.toNode(), other);
	}
}

export class FromTableBuilder extends BaseFromBuilder<FromItemTableNode> {
	protected readonly ast: FromItemTableNode;

	constructor(table: string, alias?: AliasNode) {
		super();
		this.ast = {
			type: "fromItemTableNode",
			alias,
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

	@Clone()
	columnDefinitions(columnDefinitions: readonly ColumnDefinition[][]): this {
		// can't use variadic args because `rectifyVariadicArgs()` does not handle nested arrays properly
		// TODO: make it easier to provide column definitions alongside the functions
		if (columnDefinitions.length !== this.ast.functionExpressions.length) {
			throw new UnsupportedOperationError(
				`The number of column definitions must match the number of functions. Functions: ${this.ast.functionExpressions.length}, Column definitions: ${columnDefinitions.length}`
			);
		}
		for (let i = 0; i < this.ast.functionExpressions.length; i++) {
			const node = this.ast.functionExpressions[i];
			const colDef = columnDefinitions[i];
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

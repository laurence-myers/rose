import { QuerySelector } from "../querySelector";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ConstantNode,
	FromItemNode,
	GroupByExpressionNode,
	OrderByExpressionNode,
	ParameterOrValueExpressionNode,
	SelectCommandNode,
	SelectLockingNode,
	SelectOutputExpression,
	SubSelectNode,
	TableReferenceNode,
} from "../ast";
import { QuerySelectorProcessor } from "../metadata";
import { ColumnMetamodel, QueryTable, TableMetamodel } from "../metamodel";
import { UnsupportedOperationError } from "../../errors";
import { Clone, rectifyVariadicArgs } from "../../lang";
import { FinalisedQueryWithParams } from "../finalisedQuery";
import { alias, constant } from "../dsl/core";
import { ParamsProxy, ParamsWrapper } from "../params";
import { BuildableJoin } from "./join";
import { from } from "../dsl";
import { BaseFromBuilder } from "./from";

export type SubSelectExpression =
	| SelectOutputExpression
	| ColumnMetamodel<unknown>;

type FromArg =
	| AliasedSubQueryBuilder<QuerySelector>
	| BuildableJoin
	| FromItemNode
	| QueryTable;
type GroupByArg = GroupByExpressionNode | ColumnMetamodel<unknown>;
type WithCteArg =
	| AliasedExpressionNode<SubSelectNode>
	| CommonTableExpressionBuilder<QuerySelector>;

abstract class BaseSelectQueryBuilder {
	protected queryAst: SelectCommandNode = {
		type: "selectCommandNode",
		distinction: "all",
		outputExpressions: [],
		fromItems: [],
		conditions: [],
		ordering: [],
		grouping: [],
		locking: [],
	};

	@Clone()
	with(
		first: WithCteArg | readonly WithCteArg[],
		...rest: readonly WithCteArg[]
	): this {
		const selectNodes = rectifyVariadicArgs(first, rest).map((item) => {
			if (item instanceof CommonTableExpressionBuilder) {
				return item.toNode();
			} else {
				return item;
			}
		});

		this.queryAst.with = {
			type: "withNode",
			selectNodes,
		};
		return this;
	}

	@Clone()
	distinct(): this {
		this.queryAst.distinction = "distinct";
		return this;
	}

	@Clone()
	distinctOn(expression: ParameterOrValueExpressionNode): this {
		this.queryAst.distinction = "on";
		this.queryAst.distinctOn = expression;
		return this;
	}

	@Clone()
	from(first: FromArg | FromArg[], ...rest: FromArg[]): this {
		for (const item of rectifyVariadicArgs(first, rest)) {
			const frommedItem = from(item);
			let fromItemNode: FromItemNode;
			if (frommedItem instanceof BaseFromBuilder) {
				fromItemNode = frommedItem.toNode();
			} else {
				fromItemNode = frommedItem;
			}
			this.queryAst.fromItems.push(fromItemNode);
		}
		return this;
	}

	@Clone()
	where(
		whereExpression: BooleanExpression,
		options: { replace?: boolean } = {}
	): this {
		if (options?.replace) {
			this.queryAst.conditions = [whereExpression];
		} else {
			this.queryAst.conditions.push(whereExpression);
		}
		return this;
	}

	@Clone()
	groupBy(
		first: GroupByArg | readonly GroupByArg[],
		...rest: readonly GroupByArg[]
	): this {
		const all = rectifyVariadicArgs(first, rest).map(
			(columnOrNode): GroupByExpressionNode => {
				if (columnOrNode instanceof ColumnMetamodel) {
					return {
						// TODO: Support strings to reference aliased columns/expressions
						type: "groupByExpressionNode",
						expression: columnOrNode.col(),
					};
				} else {
					return columnOrNode;
				}
			}
		);
		for (const node of all) {
			this.queryAst.grouping.push(node);
		}
		return this;
	}

	@Clone()
	orderBy(
		first: OrderByExpressionNode | readonly OrderByExpressionNode[],
		...rest: readonly OrderByExpressionNode[]
	): this {
		for (const node of rectifyVariadicArgs(first, rest)) {
			this.queryAst.ordering.push(node);
		}
		return this;
	}

	@Clone()
	limit(
		limit: ConstantNode<number>,
		offset: ConstantNode<number> = constant(0)
	): this {
		this.queryAst.limit = {
			type: "limitOffsetNode",
			limit,
			offset,
		};
		return this;
	}

	@Clone()
	for(
		lockStrength: SelectLockingNode["strength"],
		options: {
			of?: readonly QueryTable[];
			wait?: SelectLockingNode["wait"];
		} = {}
	): this {
		this.queryAst.locking.push({
			type: "selectLockingNode",
			strength: lockStrength,
			of:
				options.of?.map(
					(queryTable): TableReferenceNode => ({
						type: "tableReferenceNode",
						tableName: queryTable.$table.name,
					})
				) ?? [],
			wait: options.wait,
		});
		return this;
	}
}

export class SelectQueryBuilder<
	TQuerySelector extends QuerySelector
> extends BaseSelectQueryBuilder {
	constructor(private querySelector: TQuerySelector) {
		super();
		this.select();
	}

	protected processQuerySelector(): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(this.querySelector);
		return processor.process().outputExpressions;
	}

	protected select(): this {
		this.queryAst = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: this.processQuerySelector(),
			fromItems: [],
			conditions: [],
			ordering: [],
			grouping: [],
			locking: [],
		};
		return this;
	}

	finalise<TParams>(
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>
	): FinalisedQueryWithParams<TQuerySelector, TParams> {
		return new FinalisedQueryWithParams(
			this.querySelector,
			this.queryAst,
			paramsProxy
		);
	}
}

export class SubQueryBuilder<TParams> extends BaseSelectQueryBuilder {
	constructor(subSelectExpressions: SubSelectExpression[]) {
		super();
		this.initialSelect(subSelectExpressions);
	}

	protected processSubSelectExpressions(
		subSelectExpressions: SubSelectExpression[]
	) {
		for (const outputExpression of subSelectExpressions) {
			if (outputExpression instanceof ColumnMetamodel) {
				this.queryAst.outputExpressions.push(
					outputExpression.toColumnReferenceNode()
				);
			} else {
				this.queryAst.outputExpressions.push(outputExpression);
			}
		}
	}

	protected initialSelect(subSelectExpressions: SubSelectExpression[]): this {
		this.queryAst = {
			type: "selectCommandNode",
			distinction: "all",
			outputExpressions: [],
			fromItems: [],
			conditions: [],
			ordering: [],
			grouping: [],
			locking: [],
		};
		this.processSubSelectExpressions(subSelectExpressions);
		return this;
	}

	toSubQuery(): SubSelectNode {
		return {
			type: "subSelectNode",
			query: this.queryAst,
		};
	}
}

export type AliasedSubQueryMetamodel<T extends QuerySelector> = {
	[K in keyof T]: ColumnMetamodel<any>;
};

export class AliasedSubQueryBuilder<
	TQuerySelector extends QuerySelector
> extends BaseSelectQueryBuilder {
	constructor(
		public readonly alias: string,
		protected readonly querySelector: TQuerySelector
	) {
		super();
		this.queryAst.outputExpressions = this.processQuerySelector();
	}

	protected processQuerySelector(): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(this.querySelector);
		return processor.process().outputExpressions;
	}

	toMetamodel(): AliasedSubQueryMetamodel<TQuerySelector> {
		const output: { [key: string]: ColumnMetamodel<unknown> } = {};
		const table = new TableMetamodel(this.alias, undefined);
		for (const expr of this.queryAst.outputExpressions) {
			switch (expr.type) {
				case "aliasedExpressionNode":
					output[expr.alias.name] = new ColumnMetamodel<unknown>(
						table,
						expr.alias.name
					);
					break;
				default:
					throw new UnsupportedOperationError(
						"Only aliased expressions can be used in aliased sub-queries"
					);
			}
		}
		return output as AliasedSubQueryMetamodel<TQuerySelector>;
	}

	toNode(): AliasedExpressionNode<SubSelectNode> {
		return {
			type: "aliasedExpressionNode",
			alias: alias(this.alias),
			expression: {
				type: "subSelectNode",
				query: this.queryAst,
			},
		};
	}
}

export class CommonTableExpressionBuilder<
	TQuerySelector extends QuerySelector
> extends AliasedSubQueryBuilder<TQuerySelector> {
	select(
		callback: (
			cteMetamodel: AliasedSubQueryMetamodel<TQuerySelector>
		) => SelectQueryBuilder<TQuerySelector>
	): SelectQueryBuilder<TQuerySelector> {
		return callback(this.toMetamodel()).with(this);
	}
}

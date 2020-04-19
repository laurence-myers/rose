import { QuerySelector } from "../querySelector";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ColumnReferenceNode,
	GroupByExpressionNode,
	JoinNode,
	OrderByExpressionNode,
	ParameterOrValueExpressionNode,
	SelectCommandNode,
	SelectOutputExpression,
	SubSelectNode
} from "../ast";
import { QuerySelectorProcessor } from "../metadata";
import { ColumnMetamodel, QueryTable, TableMetamodel } from "../metamodel";
import { UnsupportedOperationError } from "../../errors";
import { Clone } from "../../lang";
import { FinalisedQueryWithParams } from "../finalisedQuery";
import { aliasTable } from "../dsl/core";
import { RectifyingWalker } from "../walkers/rectifyingWalker";
import { ParamsProxy, ParamsWrapper } from "../params";
import { TableMap } from "../../data";

export type SubSelectExpression = SelectOutputExpression | ColumnMetamodel<any>;

class JoinBuilder<TResult> {
	protected joinType: 'inner' | 'left' | 'right' | 'full' | 'cross' = 'inner';
	protected onNode?: BooleanExpression;
	protected usingNodes?: ColumnReferenceNode[];

	constructor(
		protected tableMap: TableMap,
		protected qtable: QueryTable,
		protected callback: (joinNode: JoinNode) => TResult) {
	}

	inner(): this {
		this.joinType = 'inner';
		return this;
	}

	left(): this {
		this.joinType = 'left';
		return this;
	}

	right(): this {
		this.joinType = 'right';
		return this;
	}

	full(): this {
		this.joinType = 'full';
		return this;
	}

	cross() {
		this.joinType = 'cross';
		return this.build();
	}

	on(expression: BooleanExpression) {
		this.onNode = expression;
		return this.build();
	}

	using(...columns: ColumnMetamodel<any>[]) {
		if (columns && columns.length > 0) {
			this.usingNodes = columns.map((column) => column.toColumnReferenceNode());
		}
		return this.build();
	}

	protected build(): TResult {
		if (this.onNode && this.usingNodes) {
			throw new UnsupportedOperationError(`Cannot join tables with both "on" and "using" criteria.`);
		} else if (this.joinType == 'cross' && (this.onNode || this.usingNodes)) {
			throw new UnsupportedOperationError(`Cannot make a cross join with "on" or "using" criteria.`);
		}
		const tableName = this.qtable.$table.name;
		const alias = this.tableMap.get(tableName);
		const joinNode: JoinNode = {
			type: 'joinNode',
			joinType: this.joinType,
			fromItem: {
				type: 'aliasedExpressionNode',
				alias,
				aliasPath: [alias],
				expression: {
					type: 'tableReferenceNode',
					tableName: tableName,
				}
			},
			on: this.onNode,
			using: this.usingNodes
		};
		return this.callback(joinNode);
	}
}

abstract class BaseSelectQueryBuilder {
	protected tableMap = new TableMap();
	protected queryAst: SelectCommandNode = {
		type: 'selectCommandNode',
		distinction: 'all',
		outputExpressions: [],
		fromItems: [],
		joins: [],
		conditions: [],
		ordering: [],
		grouping: []
	};

	/**
	 * Adds referenced tables as "FROM" clauses for any tables not explicitly joined/from-ed.
	 */
	protected rectifyTableReferences() {
		const rectifier = new RectifyingWalker(this.queryAst, this.tableMap);
		rectifier.rectify();
	}

	@Clone()
	with(first: AliasedExpressionNode<SubSelectNode>, ...rest: AliasedExpressionNode<SubSelectNode>[]): this {
		this.queryAst.with = {
			type: "withNode",
			selectNodes: [first].concat(rest)
		};
		return this;
	}

	@Clone()
	distinct(): this {
		this.queryAst.distinction = 'distinct';
		return this;
	}

	@Clone()
	distinctOn(expression: ParameterOrValueExpressionNode): this {
		this.queryAst.distinction = 'on';
		this.queryAst.distinctOn = expression;
		return this;
	}

	@Clone()
	from(first: QueryTable, ...rest: QueryTable[]): this {
		for (const qtable of [first].concat(rest)) {
			const tableName = qtable.$table.name;
			const alias = qtable.$table.alias || this.tableMap.get(tableName);
			this.queryAst.fromItems.push(aliasTable(tableName, alias));
		}
		return this;
	}

	@Clone()
	join(queryTable: QueryTable): JoinBuilder<this> {
		return new JoinBuilder(this.tableMap, queryTable, (joinNode) => {
			this.queryAst.joins.push(joinNode);
			return this;
		});
	}

	@Clone()
	where(whereExpression: BooleanExpression): this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	@Clone()
	groupBy(first: GroupByExpressionNode, ...rest: GroupByExpressionNode[]): this {
		this.queryAst.grouping.push(first);
		if (rest && rest.length > 0) {
			rest.forEach((node) => this.queryAst.grouping.push(node));
		}
		return this;
	}

	@Clone()
	orderBy(first: OrderByExpressionNode, ...rest: OrderByExpressionNode[]): this {
		this.queryAst.ordering.push(first);
		if (rest && rest.length > 0) {
			rest.forEach((node) => this.queryAst.ordering.push(node));
		}
		return this;
	}

	@Clone()
	limit(limitNum?: number): this { // TODO: fix this so it only accepts param getters
		this.queryAst.limit = {
			type: 'limitOffsetNode',
			limit: {
				type: 'constantNode',
				getter: limitNum !== undefined ? p => limitNum : p => p.limit
			},
			offset: {
				type: 'constantNode',
				getter: (params) => params.offset || 0
			}
		};
		return this;
	}
}

export class SelectQueryBuilder<TQuerySelector extends QuerySelector> extends BaseSelectQueryBuilder {
	constructor(private querySelector: TQuerySelector) {
		super();
		this.select();
	}

	protected processQuerySelector(): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(this.querySelector);
		return processor.process();
	}

	protected select(): this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: this.processQuerySelector(),
			fromItems: [],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: []
		};
		return this;
	}

	finalise<TParams>(paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>): FinalisedQueryWithParams<TQuerySelector, TParams> {
		return new FinalisedQueryWithParams(
			this.querySelector,
			this.queryAst,
			this.tableMap,
			paramsProxy
		);
	}
}

// TODO: how to reference expressions defined outside of this sub-query?
export class SubQueryBuilder<TParams> extends BaseSelectQueryBuilder {
	constructor(subSelectExpressions: SubSelectExpression[]) {
		super();
		this.select(subSelectExpressions);
	}

	protected processSubSelectExpressions(subSelectExpressions: SubSelectExpression[]) {
		for (let outputExpression of subSelectExpressions) {
			if (outputExpression instanceof ColumnMetamodel) {
				this.queryAst.outputExpressions.push(outputExpression.toColumnReferenceNode());
			} else {
				this.queryAst.outputExpressions.push(outputExpression);
			}
		}
	}

	protected select(subSelectExpressions: SubSelectExpression[]): this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: [],
			fromItems: [],
			joins: [],
			conditions: [],
			ordering: [],
			grouping: []
		};
		this.processSubSelectExpressions(subSelectExpressions);
		return this;
	}

	toSubQuery(): SubSelectNode {
		// TODO: merge the tableMaps so sub-queries can refer to outer tables.
		return {
			type: 'subSelectNode',
			query: this.queryAst
		};
	}
}

export type CommonTableExpressionMetamodel<T extends QuerySelector> = {
	[K in keyof T]: ColumnMetamodel<any>;
};

export class CommonTableExpressionBuilder<TQuerySelector extends QuerySelector> extends BaseSelectQueryBuilder {
	constructor(
		protected readonly alias: string,
		protected readonly querySelector: TQuerySelector
	) {
		super();
		this.queryAst.outputExpressions = this.processQuerySelector();
	}

	protected processQuerySelector(): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(this.querySelector);
		return processor.process();
	}

	toMetamodel(): CommonTableExpressionMetamodel<TQuerySelector> {
		this.rectifyTableReferences();
		const output: { [key: string]: ColumnMetamodel<unknown> } = {};
		const table = new TableMetamodel(this.alias, undefined);
		for (const expr of this.queryAst.outputExpressions) {
			switch (expr.type) {
				case "aliasedExpressionNode":
					output[expr.alias] = new ColumnMetamodel<unknown>(
						table,
						expr.alias,
					);
					break;
				default:
					throw new UnsupportedOperationError("Only aliased expressions can be used in CTEs");
			}
		}
		return output as CommonTableExpressionMetamodel<TQuerySelector>;
	}

	toNode(): AliasedExpressionNode<SubSelectNode> {
		this.rectifyTableReferences();
		return {
			type: "aliasedExpressionNode",
			alias: this.alias,
			aliasPath: [this.alias],
			expression: {
				type: 'subSelectNode',
				query: this.queryAst
			}
		};
	}
}

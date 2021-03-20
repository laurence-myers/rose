import { QuerySelector } from "../querySelector";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ConstantNode,
	GroupByExpressionNode,
	OrderByExpressionNode,
	ParameterOrValueExpressionNode,
	SelectCommandNode,
	SelectLockingNode,
	SelectOutputExpression,
	SubSelectNode,
	TableReferenceNode
} from "../ast";
import { QuerySelectorProcessor } from "../metadata";
import { ColumnMetamodel, QueryTable, TableMetamodel } from "../metamodel";
import { UnsupportedOperationError } from "../../errors";
import { Clone } from "../../lang";
import { FinalisedQueryWithParams } from "../finalisedQuery";
import { aliasTable, constant } from "../dsl/core";
import { RectifyingWalker } from "../walkers/rectifyingWalker";
import { ParamsProxy, ParamsWrapper } from "../params";
import { TableMap } from "../../data";
import { BuildableJoin } from "./join";

export type SubSelectExpression = SelectOutputExpression | ColumnMetamodel<unknown>;

type FromArg = QueryTable | AliasedSubQueryBuilder<QuerySelector>;
type GroupByArg = GroupByExpressionNode | ColumnMetamodel<unknown>;
type WithCteArg = AliasedExpressionNode<SubSelectNode> | CommonTableExpressionBuilder<QuerySelector>;

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
		grouping: [],
		locking: []
	};

	/**
	 * Adds referenced tables as "FROM" clauses for any tables not explicitly joined/from-ed.
	 */
	protected rectifyTableReferences() {
		const rectifier = new RectifyingWalker(this.queryAst, this.tableMap);
		rectifier.rectify();
	}

	@Clone()
	with(first: WithCteArg, ...rest: WithCteArg[]): this {
		const selectNodes = [first].concat(rest).map((item) => {
			if (item instanceof CommonTableExpressionBuilder) {
				return item.toNode();
			} else {
				 return item;
			}
		});

		this.queryAst.with = {
			type: "withNode",
			selectNodes
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
	from(first: FromArg, ...rest: FromArg[]): this {
		for (const item of [first].concat(rest)) {
			if (item instanceof AliasedSubQueryBuilder) {
				this.queryAst.fromItems.push(item.toNode());
			} else {
				const tableName = item.$table.name;
				const alias = item.$table.alias || this.tableMap.get(tableName);
				this.queryAst.fromItems.push(aliasTable(tableName, alias));
			}
		}
		return this;
	}

	@Clone()
	join(joinBuilder: BuildableJoin, ...otherJoins: BuildableJoin[]): this {
		for (const builder of [joinBuilder].concat(otherJoins)) {
			const joinNode = builder.build(this.tableMap);
			this.queryAst.joins.push(joinNode);
		}
		return this;
	}

	@Clone()
	joins(joinBuilders: Array<BuildableJoin>): this {
		for (const builder of joinBuilders) {
			const joinNode = builder.build(this.tableMap);
			this.queryAst.joins.push(joinNode);
		}
		return this;
	}

	@Clone()
	where(whereExpression: BooleanExpression, options: { replace?: boolean } = {}): this {
		if (options?.replace) {
			this.queryAst.conditions = [whereExpression];
		} else {
			this.queryAst.conditions.push(whereExpression);
		}
		return this;
	}

	@Clone()
	groupBy(first: GroupByArg, ...rest: Array<GroupByArg>): this {
		const all = [first].concat(rest).map((columnOrNode): GroupByExpressionNode => {
			if (columnOrNode instanceof ColumnMetamodel) {
				return { // TODO: Support strings to reference aliased columns/expressions
					type: "groupByExpressionNode",
					expression: columnOrNode.col()
				};
			} else {
				return columnOrNode;
			}
		});
		for (const node of all) {
			this.queryAst.grouping.push(node);
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
	limit(limit: ConstantNode<number>, offset: ConstantNode<number> = constant(0)): this {
		this.queryAst.limit = {
			type: 'limitOffsetNode',
			limit,
			offset
		};
		return this;
	}

	@Clone()
	for(lockStrength: SelectLockingNode['strength'], options: {
		of?: QueryTable[],
		wait?: SelectLockingNode['wait']
	} = {}): this {
		this.queryAst.locking.push({
			type: 'selectLockingNode',
			strength: lockStrength,
			of: options.of?.map((queryTable): TableReferenceNode => ({
				type: 'tableReferenceNode',
				tableName: queryTable.$table.name
			})) ?? [],
			wait: options.wait
		});
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
			grouping: [],
			locking: []
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
			grouping: [],
			locking: []
		};
		this.processSubSelectExpressions(subSelectExpressions);
		return this;
	}

	toSubQuery(): SubSelectNode {
		return {
			type: 'subSelectNode',
			query: this.queryAst,
			tableMap: this.tableMap
		};
	}
}

export type AliasedSubQueryMetamodel<T extends QuerySelector> = {
	[K in keyof T]: ColumnMetamodel<any>;
};

export class AliasedSubQueryBuilder<TQuerySelector extends QuerySelector> extends BaseSelectQueryBuilder {
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

	toMetamodel(): AliasedSubQueryMetamodel<TQuerySelector> {
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
					throw new UnsupportedOperationError("Only aliased expressions can be used in aliased sub-queries");
			}
		}
		return output as AliasedSubQueryMetamodel<TQuerySelector>;
	}

	toNode(): AliasedExpressionNode<SubSelectNode> {
		this.rectifyTableReferences();
		return {
			type: "aliasedExpressionNode",
			alias: this.alias,
			aliasPath: [this.alias],
			expression: {
				type: 'subSelectNode',
				query: this.queryAst,
				tableMap: this.tableMap
			}
		};
	}
}

export class CommonTableExpressionBuilder<TQuerySelector extends QuerySelector> extends AliasedSubQueryBuilder<TQuerySelector> {

}

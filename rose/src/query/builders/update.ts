import {
	AtLeastOne,
	Clone,
	rectifyVariadicArgs,
	sortedPopulatedKeys,
} from "../../lang";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ParameterOrValueExpressionNode,
	TableReferenceNode,
	UpdateCommandNode,
} from "../ast";
import {
	ColumnMetamodel,
	QueryTable,
	TableColumnsForUpdateCommand,
} from "../metamodel";
import { aliasTable } from "../dsl";
import {
	FinalisedQueryNonReturningWithParams,
	FinalisedQueryWithParams,
} from "../finalisedQuery";
import { QuerySelector } from "../querySelector";
import { ParamsProxy, ParamsWrapper } from "../params";
import { TableMap } from "../../data";
import { InvalidUpdateError } from "../../errors";

export class UpdateQueryBuilder<TQTable extends QueryTable> {
	protected tableMap = new TableMap();
	protected queryAst: UpdateCommandNode;

	constructor(protected readonly qtable: TQTable) {
		this.queryAst = {
			type: "updateCommandNode",
			table: this.fromSingleTable(qtable),
			setItems: [],
			fromItems: [],
			conditions: [],
		};
	}

	protected fromSingleTable(
		qtable: QueryTable
	): AliasedExpressionNode<TableReferenceNode> {
		const tableName = qtable.$table.name;
		const alias = qtable.$table.alias || this.tableMap.get(tableName);
		return aliasTable(tableName, alias);
	}

	@Clone()
	from(
		first: QueryTable | readonly QueryTable[],
		...rest: readonly QueryTable[]
	): this {
		for (const qtable of rectifyVariadicArgs(first, rest)) {
			this.queryAst.fromItems.push(this.fromSingleTable(qtable));
		}
		return this;
	}

	returning<TQuerySelector extends QuerySelector>(
		querySelector: TQuerySelector
	): UpdateReturningQueryBuilder<TQTable, TQuerySelector> {
		return new UpdateReturningQueryBuilder<TQTable, TQuerySelector>(
			this.qtable,
			this.tableMap,
			this.queryAst,
			querySelector
		);
	}

	protected getColumnNameMap(
		propertyNames: readonly string[]
	): Map<string, string> {
		const map = new Map();
		for (const propertyName of propertyNames) {
			const column = (this.qtable as any)[propertyName];
			if (column instanceof ColumnMetamodel) {
				map.set(propertyName, column.name);
			} else {
				throw new InvalidUpdateError(
					`Tried to update property "${propertyName}", but couldn't find a matching column metamodel in table "${this.qtable.$table.name}".`
				);
			}
		}
		return map;
	}

	@Clone()
	set(
		updates: AtLeastOne<Partial<TableColumnsForUpdateCommand<TQTable>>>
	): this {
		const propertyNames = sortedPopulatedKeys(updates);
		const columnsMap = this.getColumnNameMap(propertyNames);

		for (const propertyName of propertyNames) {
			const expression: ParameterOrValueExpressionNode = (updates as any)[
				propertyName
			];
			this.queryAst.setItems.push({
				type: "setItemNode",
				column: {
					type: "simpleColumnReferenceNode",
					columnName: columnsMap.get(propertyName)!,
				},
				expression,
			});
		}
		return this;
	}

	@Clone()
	where(whereExpression: BooleanExpression): this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	finalise<TParams>(
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>
	): FinalisedQueryNonReturningWithParams<TParams> {
		return new FinalisedQueryNonReturningWithParams<TParams>(
			this.queryAst,
			this.tableMap,
			paramsProxy
		);
	}
}

export class UpdateReturningQueryBuilder<
	TQTable extends QueryTable,
	TQuerySelector extends QuerySelector
> {
	constructor(
		protected readonly qtable: TQTable,
		protected readonly tableMap: TableMap,
		protected readonly queryAst: UpdateCommandNode,
		protected readonly querySelector: TQuerySelector
	) {}

	finalise<TParams>(
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>
	): FinalisedQueryWithParams<TQuerySelector, TParams> {
		return new FinalisedQueryWithParams<TQuerySelector, TParams>(
			this.querySelector,
			this.queryAst,
			this.tableMap,
			paramsProxy
		);
	}
}

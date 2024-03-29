import {
	AtLeastOne,
	Clone,
	rectifyVariadicArgs,
	sortedPopulatedKeys,
} from "../../lang";
import {
	BooleanExpression,
	ParameterOrValueExpressionNode,
	UpdateCommandNode,
} from "../ast";
import {
	ColumnMetamodel,
	QueryTable,
	TableColumnsForUpdateCommand,
} from "../metamodel";
import { from } from "../dsl";
import {
	FinalisedQueryNonReturningWithParams,
	FinalisedQueryWithParams,
} from "../finalisedQuery";
import { QuerySelector } from "../querySelector";
import { ParamsProxy, ParamsWrapper } from "../params";
import { InvalidUpdateError, UnrecognisedColumnError } from "../../errors";

export class UpdateQueryBuilder<TQTable extends QueryTable> {
	protected queryAst: UpdateCommandNode;

	constructor(protected readonly qtable: TQTable) {
		this.queryAst = {
			type: "updateCommandNode",
			table: from(qtable).toNode(),
			setItems: [],
			fromItems: [],
			conditions: [],
		};
	}

	@Clone()
	from(
		first: QueryTable | readonly QueryTable[],
		...rest: readonly QueryTable[]
	): this {
		for (const qtable of rectifyVariadicArgs(first, rest)) {
			this.queryAst.fromItems.push(from(qtable).toNode());
		}
		return this;
	}

	returning<TQuerySelector extends QuerySelector>(
		querySelector: TQuerySelector
	): UpdateReturningQueryBuilder<TQTable, TQuerySelector> {
		return new UpdateReturningQueryBuilder<TQTable, TQuerySelector>(
			this.qtable,
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
			const columnName = columnsMap.get(propertyName);
			if (!columnName) {
				throw new UnrecognisedColumnError(
					`Couldn't map property ${propertyName} to a column name`
				);
			}
			this.queryAst.setItems.push({
				type: "setItemNode",
				column: {
					type: "simpleColumnReferenceNode",
					columnName,
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
		protected readonly queryAst: UpdateCommandNode,
		protected readonly querySelector: TQuerySelector
	) {}

	finalise<TParams>(
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>
	): FinalisedQueryWithParams<TQuerySelector, TParams> {
		return new FinalisedQueryWithParams<TQuerySelector, TParams>(
			this.querySelector,
			this.queryAst,
			paramsProxy
		);
	}
}

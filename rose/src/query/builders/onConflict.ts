import {
	BooleanExpression,
	OnConflictDoNothingNode, OnConflictDoUpdateNode,
	OnConflictTargetIndexNode,
	OnConflictTargetNode, ParameterOrValueExpressionNode,
	SetItemNode
} from "../ast";
import { ColumnMetamodel, QueryTable, TableColumnsForUpdateCommand } from "../metamodel";
import { InvalidUpdateError } from "../../errors";
import { AtLeastOne, Clone, sortedPopulatedKeys } from "../../lang";

abstract class BaseInitialBuilder<TNextBuilder> {
	constructor() {
	}

	protected abstract nextBuilder(target: OnConflictTargetNode): TNextBuilder;

	/**
	 * Convenience function for `onIndexes()`
	 */
	onColumns(columns: ColumnMetamodel<unknown>[], where?: BooleanExpression): TNextBuilder {
		const indexes = columns.map((column): OnConflictTargetIndexNode => ({
			type: "onConflictTargetIndexNode",
			identifier: {
				type: "simpleColumnReferenceNode",
				columnName: column.name
			}
		}));
		return this.onIndexes(indexes, where);
	}

	onConstraint(name: string): TNextBuilder {
		return this.nextBuilder({
			type: "onConflictTargetOnConstraintNode",
			constraintName: name
		});
	}

	onIndexes(indexes: OnConflictTargetIndexNode[], where?: BooleanExpression): TNextBuilder {
		return this.nextBuilder({
			type: "onConflictTargetIndexesNode",
			indexes,
			where
		});
	}
}

export class OnConflictDoNothingBuilder extends BaseInitialBuilder<OnConflictDoNothingBuildable> {
	public nextBuilder(target: OnConflictTargetNode): OnConflictDoNothingBuildable {
		return new OnConflictDoNothingBuildable(target);
	}
}

export class OnConflictDoNothingBuildable {
	constructor(
		protected readonly target: OnConflictTargetNode
	) {

	}

	build(): OnConflictDoNothingNode {
		return {
			type: "onConflictDoNothingNode",
			target: this.target
		};
	}
}

export class OnConflictDoUpdateInitialBuilder extends BaseInitialBuilder<OnConflictDoUpdateSettingBuilder> {
	public nextBuilder(target: OnConflictTargetNode): OnConflictDoUpdateSettingBuilder {
		return new OnConflictDoUpdateSettingBuilder(target);
	}
}

export class OnConflictDoUpdateSettingBuilder {
	protected readonly setItems: SetItemNode[] = [];

	constructor(
		protected readonly target: OnConflictTargetNode
	) {
	}

	protected getColumnNameMap<TQTable extends QueryTable>(qtable: TQTable, propertyNames: string[]): Map<string, string> {
		const map = new Map();
		for (const propertyName of propertyNames) {
			const column = (qtable as any)[propertyName];
			if (column instanceof ColumnMetamodel) {
				map.set(propertyName, column.name);
			} else {
				throw new InvalidUpdateError(`Tried to update property "${ propertyName }", but couldn't find a matching column metamodel in table "${ qtable.$table.name }".`);
			}
		}
		return map;
	}

	set<TQTable extends QueryTable>(table: TQTable, updates: AtLeastOne<Partial<TableColumnsForUpdateCommand<TQTable>>>): OnConflictDoUpdateWhereBuilder {
		const propertyNames = sortedPopulatedKeys(updates);
		const columnsMap = this.getColumnNameMap(table, propertyNames);

		for (const propertyName of propertyNames) {
			const expression: ParameterOrValueExpressionNode = (updates as any)[propertyName];
			this.setItems.push({
				type: 'setItemNode',
				column: {
					type: 'simpleColumnReferenceNode',
					columnName: columnsMap.get(propertyName)!,
				},
				expression,
			});
		}
		return new OnConflictDoUpdateWhereBuilder(
			this.target,
			this.setItems
		);
	}
}

export class OnConflictDoUpdateWhereBuilder {
	protected condition?: BooleanExpression;

	constructor(
		protected readonly target: OnConflictTargetNode,
		protected readonly setItems: SetItemNode[]
	) {
	}

	@Clone()
	where(expression: BooleanExpression): this {
		this.condition = expression;
		return this;
	}

	build(): OnConflictDoUpdateNode {
		return {
			type: "onConflictDoUpdateNode",
			target: this.target,
			setItems: this.setItems,
			where: this.condition
		};
	}
}

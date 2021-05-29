import { Clone, sortedPopulatedKeys } from "../../lang";
import {
	AliasedExpressionNode,
	InsertCommandNode,
	ParameterOrValueExpressionNode,
	SelectCommandNode,
	SimpleColumnReferenceNode,
	SubSelectNode,
	TableReferenceNode
} from "../ast";
import { ColumnMetamodel, QueryTable, TableColumnsForInsertCommand } from "../metamodel";
import { aliasTable } from "../dsl";
import { FinalisedQueryNonReturningWithParams, FinalisedQueryWithParams } from "../finalisedQuery";
import { InvalidInsertError } from "../../errors";
import { QuerySelector } from "../querySelector";
import { ParamsProxy, ParamsWrapper } from "../params";
import { TableMap } from "../../data";
import { OnConflictDoUpdateWhereBuilder, OnConflictDoNothingBuildable } from "./onConflict";

export class InsertQueryBuilder<TQTable extends QueryTable, TInsertRow extends TableColumnsForInsertCommand<TQTable>> {
	protected readonly tableMap = new TableMap();
	protected readonly queryAst: InsertCommandNode;

	constructor(
		protected readonly qtable: TQTable
	) {
		this.queryAst = {
			type: 'insertCommandNode',
			table: this.fromSingleTable(qtable),
			columns: [],
			values: []
		};
	}

	protected fromSingleTable(qtable: QueryTable): AliasedExpressionNode<TableReferenceNode> {
		const tableName = qtable.$table.name;
		const alias = qtable.$table.alias || this.tableMap.get(tableName);
		return aliasTable(tableName, alias);
	}

	protected extractColumnNamesFromObject(keys: readonly string[]): readonly string[] {
		return keys.map((key) => {
			const prop = (this.qtable as any)[key];
			if (prop instanceof ColumnMetamodel) {
				return prop.name;
			} else {
				throw new InvalidInsertError(`Tried to insert property "${ key }", but couldn't find a matching column metamodel in table "${ this.qtable.$table.name }".`);
			}
		});
	}

	@Clone()
	insert(row: TInsertRow): this {
		const objectKeys = sortedPopulatedKeys(row);
		const insertColumns = this.extractColumnNamesFromObject(objectKeys);
		if (this.queryAst.columns.length > 0) {
			const existingColumns = this.queryAst.columns;
			if (
				// Is the new row missing one of the columns?
				existingColumns.some((column) => insertColumns.indexOf(column.columnName) === -1)
				// Does the new row have extra columns?
				|| insertColumns.length !== existingColumns.length
			) {
				throw new InvalidInsertError(`Inserted row columns doesn't match the expected columns. Expected: [${
					existingColumns.map((column) => `"${ column.columnName }"`)
				}], received: [${
					insertColumns.map((columnName) => `"${ columnName }"`)
				}]`);
			}
		} else {
			this.queryAst.columns.push(
				...insertColumns.map((insertColumn): SimpleColumnReferenceNode => ({
					type: "simpleColumnReferenceNode",
					columnName: insertColumn
				}))
			);
		}
		const values: ParameterOrValueExpressionNode[] = [];
		for (const key of objectKeys) {
			values.push((row as any)[key]);
		}
		this.queryAst.values.push(values);
		return this;
	}

	private getQueryOutputExpressionNames(query: SelectCommandNode): SimpleColumnReferenceNode[] {
		const outputNames: SimpleColumnReferenceNode[] = [];
		for (const node of query.outputExpressions) {
			let outputNode: SimpleColumnReferenceNode;
			switch (node.type) {
				case "aliasedExpressionNode":
					outputNode = {
						type: "simpleColumnReferenceNode",
						columnName: node.alias
					};
					break;
				case "columnReferenceNode":
					outputNode = {
						type: "simpleColumnReferenceNode",
						columnName: node.columnName
					};
					break;
				default:
					return [];
			}
			outputNames.push(outputNode);
		}
		return outputNames;
	}

	@Clone()
	insertFromQuery(query: SubSelectNode, propertyNames?: Array<keyof TInsertRow & string>): this {
		if (propertyNames === undefined) {
			const outputNames = this.getQueryOutputExpressionNames(query.query);
			if (outputNames.length > 0) {
				this.queryAst.columns.push(...outputNames);
			}
		} else if (propertyNames.length > 0) {
			const insertColumns = this.extractColumnNamesFromObject(propertyNames);
			this.queryAst.columns.push(
				...insertColumns.map((insertColumn): SimpleColumnReferenceNode => ({
					type: "simpleColumnReferenceNode",
					columnName: insertColumn
				}))
			);
		}
		this.queryAst.query = query;
		return this;
	}

	@Clone()
	onConflict(conflictAction: OnConflictDoUpdateWhereBuilder | OnConflictDoNothingBuildable): this {
		this.queryAst.onConflict = {
			type: "onConflictNode",
			conflictAction: conflictAction.build()
		};
		return this;
	}

	returning<TQuerySelector extends QuerySelector>(querySelector: TQuerySelector): InsertReturningQueryBuilder<TQTable, TQuerySelector> {
		return new InsertReturningQueryBuilder<TQTable, TQuerySelector>(
			this.qtable,
			this.tableMap,
			{
				...this.queryAst, // shallow clone
			},
			querySelector
		);
	}

	finalise<TParams>(paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>): FinalisedQueryNonReturningWithParams<TParams> {
		return new FinalisedQueryNonReturningWithParams<TParams>(
			this.queryAst,
			this.tableMap,
			paramsProxy
		);
	}
}

export class InsertReturningQueryBuilder<TQTable extends QueryTable, TQuerySelector extends QuerySelector> {
	constructor(
		protected readonly qtable: TQTable,
		protected readonly tableMap: TableMap,
		protected readonly queryAst: InsertCommandNode,
		protected readonly querySelector: TQuerySelector,
	) {
	}

	finalise<TParams>(paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams>): FinalisedQueryWithParams<TQuerySelector, TParams> {
		return new FinalisedQueryWithParams<TQuerySelector, TParams>(
			this.querySelector,
			this.queryAst,
			this.tableMap,
			paramsProxy
		);
	}
}

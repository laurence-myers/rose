import { Clone, DefaultMap } from "../../lang";
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
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { Queryable } from "../../execution/execution";
import { InvalidInsertError } from "../../errors";
import { SqlAstWalker } from "../walkers/sqlAstWalker";
import { RectifyingWalker } from "../walkers/rectifyingWalker";

export class InsertQueryBuilder<TQTable extends QueryTable, TInsertRow extends TableColumnsForInsertCommand<TQTable>, TParams> {
	protected readonly tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
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

	protected extractColumnNamesFromObject(keys: string[]): string[] {
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
		const objectKeys = Object.keys(row).sort();
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
	insertFromQuery(query: SubSelectNode, propertyNames?: Array<keyof TInsertRow & string>) {
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

	protected rectifyTableReferences() {
		if (this.queryAst.query) {
			const rectifier = new RectifyingWalker(this.queryAst.query.query, this.tableMap);
			rectifier.rectify();
		}
	}

	prepare(): PreparedQueryNonReturning<TParams> {
		this.rectifyTableReferences();
		const walker = new SqlAstWalker(this.queryAst, this.tableMap);
		const data = walker.prepare();
		return new PreparedQueryNonReturning<TParams>(data.sql, data.parameterGetters);
	}

	toSql(params: TParams): GeneratedQuery {
		return this.prepare()
			.generate(params);
	}

	execute(queryable: Queryable, params: TParams): Promise<void> {
		return this.prepare()
			.execute(queryable, params);
	}
}

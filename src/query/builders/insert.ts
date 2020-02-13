import { Clone, DefaultMap } from "../../lang";
import {
	AliasedExpressionNode,
	InsertCommandNode,
	ParameterOrValueExpressionNode,
	SimpleColumnReferenceNode,
	TableReferenceNode
} from "../ast";
import { QueryTable, TableColumnsForUpdateCommand } from "../metamodel";
import { aliasTable } from "../dsl";
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { SqlAstWalker } from "../walker";
import { Queryable } from "../../execution/execution";
import { InvalidInsertError } from "../../errors";

export class InsertQueryBuilder<TQTable extends QueryTable, TInsertRow extends TableColumnsForUpdateCommand<TQTable>, TParams> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst: InsertCommandNode;

	constructor(
		qtable: TQTable
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

	@Clone()
	insert(row: TInsertRow): this {
		const insertColumns = Object.keys(row).sort();
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
		for (const key of insertColumns) {
			values.push((row as any)[key]);
		}
		this.queryAst.values.push(values);
		return this;
	}

	prepare(): PreparedQueryNonReturning<TParams> {
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

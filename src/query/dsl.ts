import "reflect-metadata";
import {ColumnMetamodel, TABLE_METADATA_KEY, SELECT_METADATA_KEY} from "./metamodel";
import {DefaultMap} from "../lang";
import {
	InvalidTableDefinitionError, InvalidQueryClassError, RowMappingError,
	UnsupportedOperationError
} from "../errors";

export const enum Operator {
	Equals
}

export const enum SqlCommand {
	Select,
	Insert,
	Update,
	Delete
}

interface QueryClass {
	new() : any;
}

interface TableClause {
	name : string;
	alias : string;
}

interface SelectClause {
	// Naive, doesn't allow aggregates, functions, etc.
	tableAlias : string;
	column : string;
	alias : string;
}

export type WhereExpression<T> = BooleanExpression<T>;

type ExpressionValue<T> = ColumnMetamodel<T> | T;

interface BooleanExpression<T> {
	left : ExpressionValue<T>;
	operator : Operator;
	right : ExpressionValue<T>;
}

interface GeneratedQuery {
	sql : string;
	parameters : any[];
}

function isColumnMetamodel(value : any | ColumnMetamodel<any>) : value is ColumnMetamodel<any> {
	return value instanceof ColumnMetamodel;
}

class QueryBuilder<T extends QueryClass> {
	protected selectValues : SelectClause[] = [];
	protected tables : TableClause[] = [];
	protected tableMap = new DefaultMap<string, string>((key) => `t${ this.tables.length + 1 }`);
	protected whereExpression : WhereExpression<any>;

	constructor(private command : SqlCommand, private queryClass : T) {
		this.select();
	}

	protected getTableName(columnMetamodel : ColumnMetamodel<any>) : string {
		const queryTable = columnMetamodel.table;
		const tableMetamodelMetadata = Reflect.getMetadata(TABLE_METADATA_KEY, queryTable.prototype);
		if (!tableMetamodelMetadata) {
			throw new InvalidTableDefinitionError(`Table class "${ queryTable.name }" does not have any metadata.`);
		}
		const tableName = tableMetamodelMetadata.name;
		return tableName;
	}

	protected getQualifiedColumnName(columnMetamodel : ColumnMetamodel<any>) : string {
		const tableName = this.getTableName(columnMetamodel);
		const tableAlias = this.tableMap.get(tableName);
		return `"${ tableAlias }"."${ columnMetamodel.name }"`;
	}

	protected select() : this {
		const selectMetadata : Map<string, ColumnMetamodel<any>> = Reflect.getMetadata(SELECT_METADATA_KEY, this.queryClass.prototype);
		if (!selectMetadata) {
			throw new InvalidQueryClassError("The class provided to the select function does not have any column decorators.");
		}

		const entries : IterableIterator<[string, ColumnMetamodel<any>]> = selectMetadata.entries();
		for (const entry of entries) {
			const columnMetamodel : ColumnMetamodel<any> = entry[1];
			const columnName = columnMetamodel.name;
			const columnAlias : string = entry[0];
			const tableName = this.getTableName(columnMetamodel);
			const tableAlias = this.tableMap.get(tableName);

			this.tables.push({
				name: tableName,
				alias: tableAlias
			});
			this.selectValues.push({
				tableAlias,
				column: columnName,
				alias: columnAlias
			});
		}
		return this;
	}

	where(whereExpression : WhereExpression<any>) : this {
		this.whereExpression = whereExpression;
		return this;
	}

	and() : this {
		return this;
	}

	or() : this {
		return this;
	}

	not() : this {
		return this;
	}

	execute() : T[] {
		const rows = [{
			id: 1
		}];
		return rows.map((r) => this.mapRow(r));
	}

	protected mapRow(row : any) : T {
		const output = new this.queryClass();
		for (let key of this.selectValues.keys()) {
			if (row[key] === undefined) { // allow null
				throw new RowMappingError(`Selected property "${ key }" is not present in the row. Available properties: ${ Object.keys(row).join(', ') }`);
			}
			output[key] = row[key]; // TODO: parse string values, if required.
		}
		return output;
	}

	protected resolveExpressionValue(value : ExpressionValue<any>, parameterValues : any[]) : string {
		if (isColumnMetamodel(value)) {
			return this.getQualifiedColumnName(value);
		} else {
			parameterValues.push(value);
			return `$${ parameterValues.length }`;
		}
	}

	toSql() : GeneratedQuery {
		const columnsString = this.selectValues.map((c) => `"${ c.tableAlias }"."${ c.column }" as "${ c.alias }"`).join(`,`);
		const tablesString = this.tables.map((t) => `"${ t.name }" as "${ t.alias }"`).join(`,`);
		let whereString : string;
		let parameterValues : any[] = [];
		if (this.whereExpression) {
			whereString = ` WHERE (`;
			// if (whereExpression instanceof BooleanExpression) {
				switch (this.whereExpression.operator) {
					case Operator.Equals:
						// TODO: sanitized values?
						whereString += `${ this.resolveExpressionValue(this.whereExpression.left, parameterValues) } = ${ this.resolveExpressionValue(this.whereExpression.right, parameterValues) }`;
						break;
					default:
						throw new UnsupportedOperationError(`Unrecognised where clause operator: ${ this.whereExpression.operator }`);
				}
			// }
			whereString += `)`;
		} else {
			whereString = '';
		}
		const sql = `SELECT ${ columnsString } FROM ${ tablesString }${ whereString }`;
		return {
			sql,
			parameters: parameterValues
		};
	}
}

export function select<T extends QueryClass>(queryClass : T) : QueryBuilder<T> {
	return new QueryBuilder<T>(SqlCommand.Select, queryClass);
}

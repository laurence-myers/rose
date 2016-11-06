import "reflect-metadata";
import {DefaultMap} from "./lang";

class ArbaonError extends Error {

}

class UnsupportedOperationError extends ArbaonError {

}

class InvalidTableDefinitionError extends ArbaonError {

}

class InvalidColumnDefinitionError extends ArbaonError {

}

class InvalidQueryClassError extends ArbaonError {

}

class RowMappingError extends ArbaonError {

}

const METADATA_KEY_PREFIX = "arbaon.";
const TABLE_METADATA_KEY = `${ METADATA_KEY_PREFIX }table`;
export function Table<T>(metamodel : TableMetamodel) : ClassDecorator {
	return function (target : Function) {
		if (Reflect.hasMetadata(TABLE_METADATA_KEY, target)) {
			throw new InvalidTableDefinitionError(`Class "${ target.name }" already has table metadata defined.`);
		} else {
			Reflect.defineMetadata(TABLE_METADATA_KEY, metamodel, target.prototype);
		}
	}
}

const SELECT_METADATA_KEY = `${ METADATA_KEY_PREFIX }select`;
export function Column<T>(metamodel : ColumnMetamodel<any>) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		let metadata : Map<string, ColumnMetamodel<any>> = Reflect.getMetadata(SELECT_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, ColumnMetamodel<any>>();
			Reflect.defineMetadata(SELECT_METADATA_KEY, metadata, target);
		} else if (metadata.get(<string> propertyKey) !== undefined) {
			throw new InvalidColumnDefinitionError(`Property "${ propertyKey }" already has column metadata defined.`);
		}
		metadata.set(<string> propertyKey, metamodel);
	}
}

class TableMetamodel {
	constructor(
		private name : string
	) {
	}
}

const enum Operator {
	Equals
}

const enum SqlCommand {
	Select,
	Insert,
	Update,
	Delete
}

interface ColumnMetamodelOptions<R> {
	references : R;
}

abstract class ColumnMetamodel<T> {
	constructor(
		public table : Function, // hmm
		public name : string,
		public type : Function,
		private options? : ColumnMetamodelOptions<any>
	) {

	}

	eq(value : T | ColumnMetamodel<T>) : WhereClause {
		return {
			columnMetamodel: this,
			value: value,
			operator: Operator.Equals
		};
	}
}

class NumericColumnMetamodel extends ColumnMetamodel<number> {

}

@Table(new TableMetamodel("Users"))
class QUsers {
	static id = new NumericColumnMetamodel(QUsers, "id", Number);
	static locationId = new NumericColumnMetamodel(QUsers, "id", Number);

	protected constructor() {}
}

@Table(new TableMetamodel("Locations"))
class QLocations {
	static id = new NumericColumnMetamodel(QLocations, "id", Number);

	protected constructor() {}
}

class QuerySelect {
	@Column(QUsers.id)
	id : number;
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

interface WhereClause {
	value : ColumnMetamodel<any> | any;
	operator : Operator;
	columnMetamodel : ColumnMetamodel<any>;
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
	protected whereClauses : WhereClause[] = [];

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

	where(whereClause : WhereClause) : this {
		this.whereClauses.push(whereClause);
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

	toSql() : GeneratedQuery {
		const columnsString = this.selectValues.map((c) => `"${ c.tableAlias }"."${ c.column }" as "${ c.alias }"`).join(`,`);
		const tablesString = this.tables.map((t) => `"${ t.name }" as "${ t.alias }"`).join(`,`);
		let whereString : string;
		let parameterValues : any[] = [];
		if (this.whereClauses.length > 0) {
			whereString = ` WHERE (`;
			for (const whereClause of this.whereClauses) {
				switch (whereClause.operator) {
					case Operator.Equals:
						// TODO: sanitized values?
						whereString += `${ this.getQualifiedColumnName(whereClause.columnMetamodel) } = `;
						const value = whereClause.value;
						if (isColumnMetamodel(value)) {
							whereString += this.getQualifiedColumnName(value);
						} else {
							parameterValues.push(value);
							whereString += `$${ parameterValues.length }`;
						}
						break;
					default:
						throw new UnsupportedOperationError(`Unrecognised where clause operator: ${ whereClause.operator }`);
				}
			}
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

function select<T extends QueryClass>(queryClass : T) : QueryBuilder<T> {
	return new QueryBuilder<T>(SqlCommand.Select, queryClass);
}

const result = select(QuerySelect).where(QUsers.id.eq(1));
console.log(result.toSql());
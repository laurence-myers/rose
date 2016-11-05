import "reflect-metadata";
import {DefaultMap} from "./lang";

class InvalidTableDefinitionError extends Error {

}

class InvalidColumnDefinitionError extends Error {

}

class InvalidQueryClassError extends Error {

}

const METADATA_KEY_PREFIX = "arbaon.";
const TABLE_METADATA_KEY = `${ METADATA_KEY_PREFIX }table`;
export function Table<T>(metamodel : TableMetamodel) : ClassDecorator {
	console.log("Deco factory");
	return function (target : Function) {
		console.log("Deco runtime");
		if (Reflect.hasMetadata(TABLE_METADATA_KEY, target)) {
			throw new InvalidTableDefinitionError(`Class "${ target.name }" already has table metadata defined.`);
		} else {
			Reflect.defineMetadata(TABLE_METADATA_KEY, metamodel, target.prototype);
		}
	}
}

const SELECT_METADATA_KEY = `${ METADATA_KEY_PREFIX }select`;
export function Column<T>(metamodel : ColumnMetamodel) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		let metadata : Map<string, ColumnMetamodel> = Reflect.getMetadata(SELECT_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, ColumnMetamodel>();
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
		console.log("Table metamodel created!");
	}
}

interface ColumnMetamodelOptions<R> {
	references : R;
}

class ColumnMetamodel {
	constructor(
		public table : Function, // hmm
		public name : string,
		public type : Function,
		private options? : ColumnMetamodelOptions<any>
	) {

	}
}

@Table(new TableMetamodel("Users"))
class QUsers {
	static id = new ColumnMetamodel(QUsers, "id", Number);
	static locationId = new ColumnMetamodel(QUsers, "id", Number);

	protected constructor() {}
}

@Table(new TableMetamodel("Locations"))
class QLocations {
	static id = new ColumnMetamodel(QLocations, "id", Number);

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

function select(queryClass : QueryClass) : string {
	const selectMetadata : Map<string, ColumnMetamodel> = Reflect.getMetadata(SELECT_METADATA_KEY, queryClass.prototype);
	if (!selectMetadata) {
		throw new InvalidQueryClassError("The class provided to the select function does not have any column decorators.");
	}

	const result = new queryClass();
	console.log(selectMetadata);
	let tableCount = 0;
	const tableMap = new DefaultMap<string, string>((key) => `t${ ++tableCount }`);
	const selectValues : SelectClause[] = [];
	const tables : TableClause[] = [];
	const entries : IterableIterator<[string, ColumnMetamodel]> = selectMetadata.entries();
	for (const entry of entries) {
		const columnMetadata : ColumnMetamodel = entry[1];
		const columnName = columnMetadata.name;
		const columnAlias : string = entry[0];
		const queryTable = columnMetadata.table;
		const tableMetamodelMetadata = Reflect.getMetadata(TABLE_METADATA_KEY, queryTable.prototype);
		if (!tableMetamodelMetadata) {
			throw new InvalidTableDefinitionError(`Table class "${ queryTable.name }" does not have any metadata.`);
		}
		const tableName = tableMetamodelMetadata.name;
		const tableAlias = tableMap.get(tableName);

		tables.push({
			name: tableName,
			alias: tableAlias
		});
		selectValues.push({
			tableAlias,
			column: columnName,
			alias: columnAlias
		});
	}

	const columnsString = selectValues.map((c) => `"${ c.tableAlias }"."${ c.column }" as "${ c.alias }"`).join(`,`);
	const tablesString = tables.map((t) => `"${ t.name }" as "${ t.alias }"`).join(`,`);
	const sql = `SELECT ${ columnsString } FROM ${ tablesString }`;
	return sql;
}

const result = select(QuerySelect);
console.log(result);
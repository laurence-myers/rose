import inflection = require("inflection");
import {ColumnMetadata, TableMetadata} from "../dbmetadata";
import {mmap} from "../helpers";
import {POSTGRES_TO_TYPESCRIPT_TYPE_MAP} from "../dbtypes";

function sanitizeTableName(tableName : string) : string {
	return inflection.camelize(tableName, false);
}

function sanitizeColumnName(columnName : string) : string {
	return inflection.camelize(columnName, true);
}

function getColumnMetamodelString(column : ColumnMetadata) : string {
	const tsType = POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type);
	switch (tsType) {
		case "string":
			return `StringColumnMetamodel(this.$table, "${ column.name }", String)`;
		case "number":
			return `NumericColumnMetamodel(this.$table, "${ column.name }", Number)`;
		case "Date":
			return `DateColumnMetamodel(this.$table, "${ column.name }", Date)`;
		case "boolean":
			return `BooleanColumnMetamodel(this.$table, "${ column.name }", Boolean)`;
		default:
			console.log(`Unrecognised column type ${ column.type }, defaulting to generic column metamodel.`);
			return `ColumnMetamodel<any>(this.$table, "${ column.name }", Object)`;
	}
}

export function TableMetamodelTemplate(tableMetadata : TableMetadata) {
return `// Generated file; do not manually edit, as your changes will be overwritten!
// TODO: fix these imports.
import {deepFreeze} from "../src/lang";
import {ColumnMetamodel, NumericColumnMetamodel, StringColumnMetamodel, DateColumnMetamodel, BooleanColumnMetamodel, TableMetamodel, QueryTable} from "../src/query/metamodel";

export class T${ sanitizeTableName(tableMetadata.name) } extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("${ tableMetadata.name }", $tableAlias)); }
	
	${ mmap(Array.from(tableMetadata.columns.values()), (col : ColumnMetadata) => 
		`${ sanitizeColumnName(col.name) } = new ${ getColumnMetamodelString(col) };`, '\n	')}
}

export const Q${ sanitizeTableName(tableMetadata.name) } = deepFreeze(new T${ sanitizeTableName(tableMetadata.name) }());
`;
}

function writeColumnType(tableMetadata : TableMetadata) : string {
	let sb : string = '';
	sb += `export type ${ tableMetadata.name }Column = (\n`;
	let numElements = 0;
	for (let column of tableMetadata.columns.values()) {
		sb += '\t';
		if (numElements) {
			sb += '| ';
		}
		sb += `'${ column.name }'\n`;
		numElements++;
	}
	sb += `);\n\n`;
	return sb;
}

function writeColumns(tableMetadata : TableMetadata) : string {
	let sb = '';
	sb += `export const ${ tableMetadata.name }Columns = Object.freeze({\n`;
	for (let column of tableMetadata.columns.values()) {
		sb += `\t'${ column.name }': '${ column.name }',\n`;
	}
	sb += `});\n\n`;
	return sb;
}

export function ColumnNamesTemplate(tableMetadata : TableMetadata) : string {
	let sb : string = '';

	sb += writeColumnType(tableMetadata);
	sb += writeColumns(tableMetadata);

	return sb;
}

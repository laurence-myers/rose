import inflection = require("inflection");
import {ColumnMetadata, TableMetadata} from "../dbmetadata";
import {mmap} from "../helpers";
import {getColumnTypeScriptType} from "./common";

function sanitizeTableName(tableName: string): string {
	return inflection.camelize(tableName, false);
}

function sanitizeColumnName(columnName: string): string {
	return inflection.camelize(columnName, true);
}

function getColumnMetamodelName(column: ColumnMetadata): string {
	return `ColumnMetamodel<${ getColumnTypeScriptType(column) }>`;
}

function getColumnMetamodelString(column: ColumnMetadata): string {
	const escapedColumnName = column.name.replace(/"/g, '\"');
	return `${ getColumnMetamodelName(column) }(this.$table, "${ escapedColumnName }")`;
}

export function TableMetamodelTemplate(tableMetadata: TableMetadata) {
	const allImports = [
		'ColumnMetamodel',
		'deepFreeze',
		'QueryTable',
		'TableMetamodel',
	];
	allImports.sort();
	return `// Generated file; do not manually edit, as your changes will be overwritten!
import { ${ allImports.join(', ') } } from "rose";

export class T${ sanitizeTableName(tableMetadata.name) } extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("${ tableMetadata.name }", $tableAlias)); }

${ mmap(tableMetadata.columns, (col: ColumnMetadata) => 
		`	${ sanitizeColumnName(col.name) } = new ${ getColumnMetamodelString(col) };`, '\n')}
}

export const Q${ sanitizeTableName(tableMetadata.name) } = deepFreeze(new T${ sanitizeTableName(tableMetadata.name) }());
`;
}

function writeColumnType(tableMetadata: TableMetadata): string {
	let sb: string = '';
	sb += `export type ${ tableMetadata.name }Column = (\n`;
	let numElements = 0;
	for (let column of tableMetadata.columns) {
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

function writeColumns(tableMetadata: TableMetadata): string {
	let sb = '';
	sb += `export const ${ tableMetadata.name }Columns = Object.freeze({\n`;
	for (let column of tableMetadata.columns) {
		sb += `\t'${ column.name }': '${ column.name }',\n`;
	}
	sb += `});\n\n`;
	return sb;
}

export function ColumnNamesTemplate(tableMetadata: TableMetadata): string {
	let sb: string = '';

	sb += writeColumnType(tableMetadata);
	sb += writeColumns(tableMetadata);

	return sb;
}

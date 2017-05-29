import {ColumnMetadata, TableMetadata} from "../dbmetadata";
import {mmap} from "../helpers";
import {UnsupportedOperationError} from "../../errors";
import {POSTGRES_TO_TYPESCRIPT_TYPE_MAP} from "../dbtypes";

function sanitizeTableName(tableName : string) : string {
	// TODO
	return tableName;
}

function sanitizeColumnName(columnName : string) : string {
	// TODO
	return columnName;
}

function getColumnMetamodelString(column : ColumnMetadata) : string {
	const tsType = POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type);
	const dummyString = `StringColumnMetamodel(this.$table, "${ column.name }", String)`;
	switch (tsType) {
		case "string":
			return `StringColumnMetamodel(this.$table, "${ column.name }", String)`;
		case "number":
			return `NumericColumnMetamodel(this.$table, "${ column.name }", Number)`;
		case "Date":
			console.log(`Ignoring date column ${ column.name }`);
			return dummyString;
		case "boolean":
			console.log(`Ignoring boolean column ${ column.name }`);
			return dummyString;
		default:
			if (['_varchar', 'json'].indexOf(column.type) > -1) {
				console.log(`Ignoring "${ column.type }" column ${ column.name }`);
				return dummyString;
			}
			throw new UnsupportedOperationError(`Unsupported type "${ column.type }" for column "${ column.name }"; sorry!`);
	}
}

export function TableMetamodelTemplate(tableMetadata : TableMetadata) {
return `// Generated file; do not manually edit, as your changes will be overwritten!
// TODO: fix these imports.
import {deepFreeze} from "../src/lang";
import {NumericColumnMetamodel, StringColumnMetamodel, TableMetamodel, QueryTable} from "../src/query/metamodel";

export class T${ sanitizeTableName(tableMetadata.name) } extends QueryTable {
	$table = new TableMetamodel("${ tableMetadata.name }", this.$tableAlias);
	
	${ mmap(Array.from(tableMetadata.columns.values()), (col : ColumnMetadata) => 
		`${ sanitizeColumnName(col.name) } = new ${ getColumnMetamodelString(col) };`, '\n	')}
}

export const Q${ sanitizeTableName(tableMetadata.name) } = deepFreeze(T${ sanitizeTableName(tableMetadata.name) });
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

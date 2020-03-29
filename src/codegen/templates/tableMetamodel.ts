import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { mmap } from "../helpers";
import { getColumnTypeScriptType } from "./common";

function getColumnMetamodelName(column: ColumnMetadata): string {
	return `ColumnMetamodel<${ getColumnTypeScriptType(column) }>`;
}

function getColumnMetamodelString(column: ColumnMetadata): string {
	const escapedColumnName = column.name.replace(/"/g, '\"');
	return `${ getColumnMetamodelName(column) }(this.$table, "${ escapedColumnName }")`;
}

export function TableMetamodelTemplate(table: TableMetadata) {
	const allImports = [
		'ColumnMetamodel',
		'deepFreeze',
		'QueryTable',
		'TableMetamodel',
	];
	allImports.sort();
	return `// Generated file; do not manually edit, as your changes will be overwritten!
import { ${ allImports.join(', ') } } from "rose";

export class T${ table.niceName } extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("${ table.name }", $tableAlias)); }

${ mmap(table.columns, (col: ColumnMetadata) => 
		`	${ col.niceName } = new ${ getColumnMetamodelString(col) };`, '\n') }
}

export const Q${ table.niceName } = deepFreeze(new T${ table.niceName }());
`;
}

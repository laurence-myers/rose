import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType } from "./common";

export function TableInsertRowTemplate(table: TableMetadata): string {
	let sb: string = '';
	sb += `export interface ${ table.niceName }InsertRow {\n`;
	for (let column of table.columns) {
		const columnTsType = getColumnTypeScriptType(column);
		sb += `\t${ column.name }${ column.isNullable || column.hasDefault ? '?' : '' }: ${ columnTsType };\n`;
	}
	sb += `}\n`;
	return sb;
}

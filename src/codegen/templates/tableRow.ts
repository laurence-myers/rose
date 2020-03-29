import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType, sanitizeTableName } from "./common";

export function TableRowTemplate(table: TableMetadata): string {
	let sb: string = '';
	sb += `export interface ${ table.niceName }Row {\n`;
	for (let column of table.columns) {
		const columnTsType = getColumnTypeScriptType(column);
		sb += `\t${ column.name }: ${ columnTsType };\n`;
	}
	sb += `}\n`;
	return sb;
}

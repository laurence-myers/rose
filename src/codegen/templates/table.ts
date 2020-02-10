import {TableMetadata} from "../dbmetadata";
import {getColumnTypeScriptType} from "./common";

export function TableTemplate(tableMetadata: TableMetadata): string {
	let sb: string = '';
	sb += `export interface ${ tableMetadata.name }Row {\n`;
	for (let column of tableMetadata.columns) {
		const columnTsType = getColumnTypeScriptType(column);
		sb += `\t${ column.name }: ${ columnTsType };\n`;
	}
	sb += `}\n`;
	return sb;
}

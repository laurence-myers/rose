import {TableMetadata} from "../dbmetadata";
import {POSTGRES_TO_TYPESCRIPT_TYPE_MAP} from "../dbtypes";

export function TableTemplate(tableMetadata : TableMetadata) : string {
	let sb : string = '';
	sb += `export interface ${ tableMetadata.name }Row {\n`;
	for (let column of tableMetadata.columns.values()) {
		sb += `\t${ column.name }${ column.isNullable ? '?' : '' } : ${ POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type) };\n`;
	}
	sb += `}\n`;
	return sb;
}
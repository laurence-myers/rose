import {TableMetadata} from "../explore";
import {POSTGRES_TO_TYPESCRIPT_TYPE_MAP} from "../dbtypes";

export function TableTemplate(tableMetadata : TableMetadata) : string {
	const sb : string[] = [];
	sb.push(`interface T${ tableMetadata.name } {\n`);
	for (let column of tableMetadata.columns.values()) {
		sb.push(`\t${ column.name } : ${ POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type) };\n`);
	}
	sb.push(`}\n`);
	return sb.join('');
}
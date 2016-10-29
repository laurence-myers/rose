import {TableMetadata} from "../explore";

export function TableMetamodelTemplate(tableMetadata : TableMetadata) : string {
	const sb : string[] = [];

	sb.push(`export type ${ tableMetadata.name }Column = (\n`);
	let numElements = 0;
	for (let column of tableMetadata.columns.values()) {
		sb.push('\t');
		if (numElements) {
			sb.push('| ');
		}
		sb.push(`'${ column.name }'\n`);
		numElements++;
	}
	sb.push(`);\n\n`);

	sb.push(`export const ${ tableMetadata.name }Columns = Object.freeze({\n`);
	for (let column of tableMetadata.columns.values()) {
		sb.push(`\t'${ column.name }': '${ column.name }',\n`);
	}
	sb.push(`});\n`);
	return sb.join('');
}
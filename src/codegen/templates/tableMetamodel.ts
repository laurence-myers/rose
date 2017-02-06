import {TableMetadata} from "../dbmetadata";

export function TableMetamodelTemplate(tableMetadata : TableMetadata) : string {
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

	sb += `export const ${ tableMetadata.name }Columns = Object.freeze({\n`;
	for (let column of tableMetadata.columns.values()) {
		sb += `\t'${ column.name }': '${ column.name }',\n`;
	}
	sb += `});\n`;
	return sb;
}
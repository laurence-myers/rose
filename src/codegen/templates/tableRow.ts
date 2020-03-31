import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType } from "./common";
import { anno, iface, ifaceProp } from "../dsl";
import { astToString } from "../walker";

export function TableRowTemplate(table: TableMetadata): string {
	return astToString(
		iface(
			table.niceName + 'Row',
			table.columns.map((col) => ifaceProp(
				col.name,
				anno(getColumnTypeScriptType(col))
			)),
			[],
			true
		)
	);
}

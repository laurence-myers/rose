import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType, insertRowIfaceName } from "./common";
import { astToString } from "../walker";
import { anno, iface, ifaceProp } from "../dsl";

export function TableInsertRowTemplate(table: TableMetadata): string {
	return astToString(
		iface(
			insertRowIfaceName(table),
			table.columns.map((col) => ifaceProp(
				col.name,
				anno(getColumnTypeScriptType(col)),
				col.isNullable || col.hasDefault
			)),
			[],
			true
		),
	);
}

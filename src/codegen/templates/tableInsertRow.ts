import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType, insertRowIfaceName } from "./common";
import { anno, iface, ifaceProp } from "../dsl";
import { InterfaceNode } from "../ast";

export function TableInsertRowTemplate(table: TableMetadata): InterfaceNode {
	return iface(
		insertRowIfaceName(table),
		table.columns.map((col) => ifaceProp(
			col.niceName,
			anno(getColumnTypeScriptType(col)),
			col.isNullable || col.hasDefault
		)),
		[],
		true
	);
}

import { TableMetadata } from "../dbmetadata";
import { insertRowIfaceName } from "./common";
import { anno, iface, ifaceProp } from "../dsl";
import { InterfaceNode } from "../ast";

export function TableInsertRowTemplate(table: TableMetadata): InterfaceNode {
	return iface(
		insertRowIfaceName(table),
		table.columns.map((col) => ifaceProp(
			col.niceName,
			anno(col.tsType.type),
			col.isNullable || col.hasDefault
		)),
		[],
		true
	);
}

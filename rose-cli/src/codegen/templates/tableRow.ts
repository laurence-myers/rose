import { TableMetadata } from "../dbmetadata";
import { rowIfaceName } from "./common";
import { anno, iface, ifaceProp, InterfaceNode } from "tscodegendsl";

export function TableRowTemplate(table: TableMetadata): InterfaceNode {
	return iface(
		rowIfaceName(table),
		table.columns.map((col) => ifaceProp(col.niceName, anno(col.tsType.type))),
		[],
		true
	);
}

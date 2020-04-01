import { TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType, rowIfaceName } from "./common";
import { anno, iface, ifaceProp } from "../dsl";
import { astToString } from "../walker";

export function TableRowTemplate(table: TableMetadata): string {
	return astToString(
		iface(
			rowIfaceName(table),
			table.columns.map((col) => ifaceProp(
				col.name,
				anno(getColumnTypeScriptType(col))
			)),
			[],
			true
		)
	);
}

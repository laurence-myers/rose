import { TableMetadata } from "../dbmetadata";
import {
	body,
	imp,
	ImportNode,
	modl,
	namedImport,
	uniqueImports,
} from "tscodegendsl";

export function CustomImportsTemplate(tableMetadata: TableMetadata) {
	const allImports = tableMetadata.columns
		.map((col) => {
			if (col.tsType.importName && col.tsType.from) {
				return imp([namedImport(col.tsType.importName)], col.tsType.from);
			} else {
				return undefined;
			}
		})
		.filter((entry): entry is ImportNode => entry !== undefined);
	const imports = uniqueImports(allImports);
	return modl(imports, body([]));
}

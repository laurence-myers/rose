import { TableMetadata } from "../dbmetadata";
import { body, imp, modl, namedImport } from "../dsl";
import { uniqueImports } from "../utils";
import { ImportNode } from "../ast";

export function CustomImportsTemplate(tableMetadata: TableMetadata) {
	const allImports = tableMetadata.columns.map((col) => {
			if (col.tsType.importName && col.tsType.from) {
				return imp([namedImport(col.tsType.importName)], col.tsType.from);
			} else {
				return undefined;
			}
		}).filter((entry): entry is ImportNode => entry !== undefined);
	const imports = uniqueImports(allImports);
	return modl(
		imports,
		body([])
	);
}

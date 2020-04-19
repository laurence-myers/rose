import { ImportNode, NamedImportNode } from "./ast";

export function uniqueImports(imports: ImportNode[]) {
	const output = [];
	const namedImportsMap = new Map<string, NamedImportNode[]>();
	for (const node of imports) {
		if (node.importType === "named") {
			let existingNamedImports = namedImportsMap.get(node.from);
			if (existingNamedImports) {
				// Merge named imports
				let added = false;
				for (const namedImportToAdd of node.namedItems!) {
					let exists = existingNamedImports.some((node) => node.name === namedImportToAdd.name);
					if (!exists) {
						existingNamedImports.push(namedImportToAdd);
						added = true;
					}
				}
				if (added) {
					existingNamedImports.sort((a, b) => a.name.localeCompare(b.name));
				}
			} else {
				namedImportsMap.set(node.from, node.namedItems!);
				output.push(node);
			}
		} else {
			output.push(node);
		}
	}
	return output;
}

export function mergeImports(firstImports: ImportNode[], secondImports: ImportNode[]) {
	const imports = firstImports.slice();
	for (const importNode1 of secondImports) {
		let importMatched = false;
		for (const importNode2 of imports) {
			if (importNode1.from === importNode2.from) {
				importMatched = true;
				if (importNode1.importType === importNode2.importType && importNode1.importType !== 'named' && importNode1.alias === importNode2.alias) {
					// Skip if we're importing the exact same thing.
					continue;
				} else if (importNode1.namedItems && importNode2.namedItems) {
					// Merge named imports
					let added = false;
					for (const namedImportToAdd of importNode1.namedItems) {
						let exists = importNode2.namedItems.some((node) => node.name === namedImportToAdd.name);
						if (!exists) {
							importNode2.namedItems.push(namedImportToAdd);
							added = true;
						}
					}
					if (added) {
						importNode2.namedItems.sort((a, b) => a.name.localeCompare(b.name));
					}
				} else {
					imports.push(importNode1);
				}
			}
		}
		if (!importMatched) {
			imports.push(importNode1);
		}
	}
	return imports;
}

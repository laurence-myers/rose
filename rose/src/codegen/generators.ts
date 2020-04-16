import { TableRowTemplate } from "./templates/tableRow";
import { TableMetamodelTemplate } from "./templates/tableMetamodel";
import { TableMetadata } from "./dbmetadata";
import { TableInsertRowTemplate } from "./templates/tableInsertRow";
import { ModuleNode } from "./ast";
import { body, comment, modl, stmt } from "./dsl";
import { OrmTemplate } from "./templates/orm";
import { astToString } from "./walker";

function mergeModules(first: ModuleNode, second: ModuleNode) {
    const imports = first.imports.slice();
    for (const importNode1 of second.imports) {
        for (const importNode2 of imports) {
            if (importNode1.from === importNode2.from) {
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
                    second.imports.push(importNode1);
                }
            }
        }
    }
    const bodyNode = body(first.body.statements.concat(second.body.statements));
    const header = first.header.concat(second.header);
    return modl(
        imports,
        bodyNode,
        header
    );
}

export function generateTableCode(tableMetadata: TableMetadata): string {
    const module = mergeModules(
        TableMetamodelTemplate(tableMetadata),
        OrmTemplate(tableMetadata)
    );
    module.body.statements.unshift(
        stmt(TableRowTemplate(tableMetadata)),
        stmt(TableInsertRowTemplate(tableMetadata))
    );
    module.header.push(comment(`Generated file; do not manually edit, as your changes will be overwritten!`));
    module.header.push(comment('eslint-disable', 'block'));
    return astToString(module);
}

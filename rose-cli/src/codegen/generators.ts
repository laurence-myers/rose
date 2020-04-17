import { TableRowTemplate } from "./templates/tableRow";
import { TableMetamodelTemplate } from "./templates/tableMetamodel";
import { TableMetadata } from "./dbmetadata";
import { TableInsertRowTemplate } from "./templates/tableInsertRow";
import { ModuleNode } from "./ast";
import { body, comment, modl, stmt } from "./dsl";
import { OrmTemplate } from "./templates/orm";
import { astToString } from "./walker";
import { mergeImports } from "./utils";
import { CustomImportsTemplate } from "./templates/customImports";

function mergeModules(first: ModuleNode, second: ModuleNode) {
    const imports = mergeImports(first.imports, second.imports);
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
        CustomImportsTemplate(tableMetadata),
        mergeModules(
            TableMetamodelTemplate(tableMetadata),
            OrmTemplate(tableMetadata)
        )
    );
    module.body.statements.unshift(
        stmt(TableRowTemplate(tableMetadata)),
        stmt(TableInsertRowTemplate(tableMetadata))
    );
    module.header.push(comment(`Generated file; do not manually edit, as your changes will be overwritten!`));
    module.header.push(comment('eslint-disable', 'block'));
    return astToString(module);
}

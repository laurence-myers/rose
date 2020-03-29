import { TableRowTemplate } from "./templates/tableRow";
import { TableMetamodelTemplate } from "./templates/tableMetamodel";
import { TableMetadata } from "./dbmetadata";
import { TableInsertRowTemplate } from "./templates/tableInsertRow";

export function generateTableCode(tableMetadata: TableMetadata): string {
    return [
        TableMetamodelTemplate(tableMetadata),
        TableRowTemplate(tableMetadata),
        TableInsertRowTemplate(tableMetadata),
    ].join('\n');
}

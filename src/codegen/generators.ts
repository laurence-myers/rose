import {TableTemplate} from "./templates/table";
import {TableMetamodelTemplate} from "./templates/tableMetamodel";
import {TableMetadata} from "./dbmetadata";

export function generateTableCode(tableMetadata: TableMetadata): string {
    return [TableMetamodelTemplate(tableMetadata), TableTemplate(tableMetadata)].join('\n');
}

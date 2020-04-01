import inflection = require("inflection");
import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { POSTGRES_TO_TYPESCRIPT_TYPE_MAP } from "../dbtypes";
import { UnrecognisedColumnTypeError } from "../../errors";

export function sanitizeTableName(tableName: string): string {
	return inflection.camelize(tableName, false);
}

export function sanitizeColumnName(columnName: string): string {
	return inflection.camelize(columnName, true);
}

export function getColumnTypeScriptType(column: ColumnMetadata): string {
	let tsType = POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type);
	if (!tsType) {
		throw new UnrecognisedColumnTypeError(`No mapping defined for column type: "${ column.type }"`);
	}
	if (column.isNullable) {
		tsType += ' | null'
	}
	return tsType;
}

export function metamodelClassName(table: TableMetadata): string {
	return 'T' + table.niceName;
}

export function metamodelInstanceName(table: TableMetadata): string {
	return 'Q' + table.niceName;
}

export function rowIfaceName(table: TableMetadata): string {
	return table.niceName + 'Row';
}

export function insertRowIfaceName(table: TableMetadata): string {
	return table.niceName + 'InsertRow';
}

export function allColumnsName(table: TableMetadata): string {
	return table.niceName + 'AllColumns';
}

import * as camelcase from "camelcase";
import { TableMetadata } from "../dbmetadata";

export function sanitizeTableName(tableName: string): string {
	return camelcase(tableName, { pascalCase: true });
}

export function sanitizeColumnName(columnName: string): string {
	return camelcase(columnName);
}

export function metamodelClassName(table: TableMetadata): string {
	return "T" + table.niceName;
}

export function metamodelInstanceName(table: TableMetadata): string {
	return "Q" + table.niceName;
}

export function rowIfaceName(table: TableMetadata): string {
	return table.niceName + "Row";
}

export function insertRowIfaceName(table: TableMetadata): string {
	return table.niceName + "InsertRow";
}

export function allColumnsName(table: TableMetadata): string {
	return table.niceName + "AllColumns";
}

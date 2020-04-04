import * as camelcase from "camelcase";
import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { POSTGRES_TO_TYPESCRIPT_TYPE_MAP } from "../dbtypes";
import { UnrecognisedColumnTypeError } from "../../errors";

export function sanitizeTableName(tableName: string): string {
	return camelcase(tableName, { pascalCase: true });
}

export function sanitizeColumnName(columnName: string): string {
	return camelcase(columnName);
}

export function getColumnTypeScriptType(column: ColumnMetadata): string {
	let isArray = column.type.startsWith('_');
	let tsType = POSTGRES_TO_TYPESCRIPT_TYPE_MAP.get(column.type.replace(/^_/, ''));
	if (!tsType) {
		throw new UnrecognisedColumnTypeError(`No mapping defined for column type: "${ column.type }"`);
	}
	if (isArray) {
		tsType += '[]'
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

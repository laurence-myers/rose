import inflection = require("inflection");
import { ColumnMetadata } from "../dbmetadata";
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

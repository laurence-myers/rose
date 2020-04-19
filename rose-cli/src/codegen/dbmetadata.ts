import { DefaultMap } from "../lang";
import { QueryResult } from "pg";
import { sanitizeColumnName, sanitizeTableName } from "./templates/common";
import { Queryable } from "../execution";
import { UnrecognisedColumnTypeError } from "../errors";
import { IntrospectConfig, TypeMapEntry } from "../config";

type sql_identifier = string;
// type cardinal_number = number;
// type character_data = string;
type yes_or_no = 'YES' | 'NO';

interface ColumnsRow {
	// udt_catalog : sql_identifier;
	// udt_schema : sql_identifier;
	udt_name: sql_identifier;
	// table_catalog : sql_identifier;
	// table_schema : sql_identifier;
	table_name: sql_identifier;
	column_name: sql_identifier;
	column_default: string; // SQL expression or value
	is_nullable: yes_or_no;
}

function yesOrNoToBoolean(yesOrNo: yes_or_no): boolean {
	return yesOrNo === 'YES';
}

/* Potential columns:
 column_udt_usage: datatypes of each column
 key_column_usage
 referential_constraints
 sequences
 table_constraints
 views
 */

function getColumnTypeScriptType(tableName: string, column: ColumnMetadata, typeMaps: IntrospectConfig['types']): TypeMapEntry & { importName?: string } {
	let isArray = column.type.startsWith('_');
	let tsTypeEntry = typeMaps.columns.get([tableName, column.name].join('.'));
	let newTypeName;

	if (!tsTypeEntry) {
		const sanitisedType = column.type.replace(/^_/, ''); // Remove the array character
		tsTypeEntry = typeMaps.global.get(sanitisedType);
		if (!tsTypeEntry) {
			tsTypeEntry = typeMaps.enums.get(sanitisedType);
			if (!tsTypeEntry) {
				throw new UnrecognisedColumnTypeError(`No mapping defined for column type: "${ column.type }"`);
			}
		}
		if (isArray) {
			newTypeName = `Array<${ tsTypeEntry.type }>`;
		}
	}

	if (column.isNullable) {
		newTypeName = tsTypeEntry.type + ' | null';
	}
	return {
		...tsTypeEntry,
		type: newTypeName || tsTypeEntry.type,
		importName: tsTypeEntry.type
	};
}

export class ColumnMetadata {
	public readonly niceName: string = sanitizeColumnName(this.name);
	public readonly tsType: TypeMapEntry & { importName?: string };

	constructor(
		tableName: string,
		public readonly name: string,
		public readonly type: string,
		public readonly isNullable: boolean,
		public readonly hasDefault: boolean,
		typeMaps: IntrospectConfig['types']
	) {
		this.tsType = getColumnTypeScriptType(tableName, this, typeMaps);
	}
}

export class TableMetadata {
	public readonly niceName: string = sanitizeTableName(this.name);
	public readonly columns: Array<ColumnMetadata> = [];

	constructor(
		public readonly schema: string,
		public readonly name: string,
		public readonly primaryKeys: string[] = []
	) {
	}
}

const enumQuery = `SELECT
	  type.typname AS name,
	  string_agg('''' || enum.enumlabel || '''', ' | ') AS value
	FROM pg_enum AS enum
	JOIN pg_type AS type
	  ON (type.oid = enum.enumtypid)
	GROUP BY type.typname;`;

const columnMetadataQuery = `SELECT "udt_name",
       "table_name",
       "column_name",
       "column_default",
       "is_nullable"
	FROM "information_schema"."columns"
	WHERE "table_schema" = $1
		AND NOT lower("table_name") = ANY($2)
	ORDER BY "table_name",
	         "column_name"`;

const constraintQuery = `SELECT kcu.table_schema,
           kcu.table_name,
           tc.constraint_name,
           kcu.ordinal_position as position,
           kcu.column_name as column_name
    FROM information_schema.table_constraints tc
	JOIN information_schema.key_column_usage kcu
	  ON (kcu.constraint_name = tc.constraint_name
		AND kcu.constraint_schema = tc.constraint_schema
		AND kcu.constraint_name = tc.constraint_name)
    WHERE tc.table_schema = $1
      AND tc.constraint_type = $2
      AND NOT lower(kcu."table_name") = ANY($3)
    ORDER BY kcu.table_schema,
             kcu.table_name,
             position;`;

async function populateEnumTypes(client: Queryable, config: IntrospectConfig) {
	const result: QueryResult = await client.query(enumQuery, []);
	const rows: {
		name: string;
		value: string;
	}[] = result.rows;
	for (const row of rows) {
		config.types.enums.set(row.name, {
			type: row.value
		});
	}
}

async function populateColumnTypes(client: Queryable, tablesMetadata: DefaultMap<string, TableMetadata>, config: IntrospectConfig): Promise<void> {
	const result: QueryResult = await client.query(columnMetadataQuery, [config.schema, config.ignoredTables]);
	const rows: ColumnsRow[] = result.rows;
	for (const row of rows) {
		const tableMetadata = tablesMetadata.get(row.table_name);
		const column = new ColumnMetadata(row.table_name, row.column_name, row.udt_name, yesOrNoToBoolean(row.is_nullable), row.column_default !== null, config.types);
		tableMetadata.columns.push(column);
	}
}

async function populatePrimaryKeys(client: Queryable, tablesMetadata: DefaultMap<string, TableMetadata>, config: IntrospectConfig): Promise<void> {
	const result: QueryResult = await client.query(constraintQuery, [config.schema, 'PRIMARY KEY', config.ignoredTables]);
	const rows: Array<{
		table_schema: string;
		table_name: string;
		constraint_name: string;
		ordinal_position: number;
		column_name: string;
	}> = result.rows;
	for (const row of rows) {
		const tableMetadata = tablesMetadata.get(row.table_name);
		tableMetadata.primaryKeys.push(row.column_name);
	}
}

export async function getTableMetadata(client: Queryable, config: IntrospectConfig): Promise<DefaultMap<string, TableMetadata>> {
	const tablesMetadata: DefaultMap<string, TableMetadata> = new DefaultMap<string, TableMetadata>((key: string) => new TableMetadata(config.schema, key));
	await populateEnumTypes(client, config);
	await populateColumnTypes(client, tablesMetadata, config);
	await populatePrimaryKeys(client, tablesMetadata, config);
	return tablesMetadata;
}

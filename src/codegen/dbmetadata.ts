import { DefaultMap } from "../lang";
import { Client, QueryResult } from "pg";
import { sanitizeColumnName, sanitizeTableName } from "./templates/common";

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

export class ColumnMetadata {
	public readonly niceName: string = sanitizeColumnName(this.name);
	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly isNullable: boolean,
		public readonly hasDefault: boolean
	) {
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

const columnMetadataQuery = `SELECT "udt_name", "table_name", "column_name", "column_default", "is_nullable" FROM "information_schema"."columns" WHERE "table_schema" = $1 ORDER BY "table_name", "column_name"`;

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
    ORDER BY kcu.table_schema,
             kcu.table_name,
             position;`;

async function populateColumnTypes(client: Client, tablesMetadata: DefaultMap<string, TableMetadata>, schema: string): Promise<void> {
	const result: QueryResult = await client.query(columnMetadataQuery, [schema]);
	const rows: ColumnsRow[] = result.rows;
	rows.forEach((row) => {
		const tableMetadata = tablesMetadata.get(row.table_name);
		const column = new ColumnMetadata(row.column_name, row.udt_name, yesOrNoToBoolean(row.is_nullable), row.column_default !== null);
		tableMetadata.columns.push(column);
	});
}

async function populatePrimaryKeys(client: Client, tablesMetadata: DefaultMap<string, TableMetadata>, schema: string): Promise<void> {
	const result: QueryResult = await client.query(constraintQuery, [schema, 'PRIMARY KEY']);
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

export async function getTableMetadata(client: Client, schema: string = 'public'): Promise<DefaultMap<string, TableMetadata>> {
	const tablesMetadata: DefaultMap<string, TableMetadata> = new DefaultMap<string, TableMetadata>((key: string) => new TableMetadata(schema, key));
	await populateColumnTypes(client, tablesMetadata, schema);
	await populatePrimaryKeys(client, tablesMetadata, schema);
	return tablesMetadata;
}

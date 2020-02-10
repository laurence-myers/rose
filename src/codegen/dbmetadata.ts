import {DefaultMap} from "../lang";
import {Client, QueryResult} from "pg";

type sql_identifier = string;
// type cardinal_number = number;
// type character_data = string;
type yes_or_no = 'YES'|'NO';

interface ColumnsRow {
	// udt_catalog : sql_identifier;
	// udt_schema : sql_identifier;
	udt_name: sql_identifier;
	// table_catalog : sql_identifier;
	// table_schema : sql_identifier;
	table_name: sql_identifier;
	column_name: sql_identifier;
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
	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly isNullable: boolean
	) {
	}
}

export class TableMetadata {
	public readonly columns = new Map<string, ColumnMetadata>();

	constructor(public readonly name: string) {
	}
}

const SCHEMA = 'public';

async function populateColumnTypes(client: Client, tablesMetadata: DefaultMap<string, TableMetadata>): Promise<void> {
	const result: QueryResult = await client.query(`SELECT "udt_name", "table_name", "column_name", "is_nullable" FROM "information_schema"."columns" WHERE "table_schema" = '${ SCHEMA }'`);
	const rows: ColumnsRow[] = result.rows;
	rows.forEach((row) => {
		const tableMetadata = tablesMetadata.get(row.table_name);
		const column = new ColumnMetadata(row.column_name, row.udt_name, yesOrNoToBoolean(row.is_nullable));
		tableMetadata.columns.set(row.column_name, column);
	});
}

export async function getTableMetadata(client: Client): Promise<DefaultMap<string, TableMetadata>> {
	const tablesMetadata: DefaultMap<string, TableMetadata> = new DefaultMap<string, TableMetadata>((key: string) => new TableMetadata(key));
	await populateColumnTypes(client, tablesMetadata);
	return tablesMetadata;
}
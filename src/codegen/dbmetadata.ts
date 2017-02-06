import {DefaultMap} from "../lang";
import {Client, QueryResult} from "pg";

type sql_identifier = string;
// type cardinal_number = number;
// type character_data = string;
type yes_or_no = 'YES'|'NO';

interface ColumnsRow {
	// udt_catalog : sql_identifier;
	// udt_schema : sql_identifier;
	udt_name : sql_identifier;
	// table_catalog : sql_identifier;
	// table_schema : sql_identifier;
	table_name : sql_identifier;
	column_name : sql_identifier;
	is_nullable : yes_or_no;
}

function yesOrNoToBoolean(yesOrNo : yes_or_no) : boolean {
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
	public type : string;
	public isNullable : boolean;

	constructor(public name : string) {

	}
}

export class TableMetadata {
	public columns = new DefaultMap<string, ColumnMetadata>((key : string) => new ColumnMetadata(key));

	constructor(public name : string) {
	}
}

const SCHEMA = 'public';

function populateColumnTypes(client : Client, tablesMetadata : Map<string, TableMetadata>) : Promise<void> {
	return client.query(`SELECT "udt_name", "table_name", "column_name", "is_nullable" FROM "information_schema"."columns" WHERE "table_schema" = '${ SCHEMA }'`)
		.then((result : QueryResult) => {
			const rows : ColumnsRow[] = result.rows;
			rows.forEach((row) => {
				const tableMetadata = tablesMetadata.get(row.table_name);
				if (tableMetadata == undefined) throw new Error("Table metadata should never be undefined");
				const column : ColumnMetadata = tableMetadata.columns.get(row.column_name);
				if (column == undefined) throw new Error("Column metadata should never be undefined");
				column.type = row.udt_name;
				column.isNullable = yesOrNoToBoolean(row.is_nullable);
			});
		});
}

export function getTableMetadata(client : Client) : Promise<Map<string, TableMetadata>> {
	const tablesMetadata : Map<string, TableMetadata> = new DefaultMap<string, TableMetadata>((key : string) => new TableMetadata(key));
	return populateColumnTypes(client, tablesMetadata)
		.then(() => {
			return tablesMetadata;
		});
}
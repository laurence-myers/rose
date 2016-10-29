import {Pool, Client, QueryResult} from "pg";
// import R = require('ramda');
import {DefaultMap} from "./lang";
import {TableTemplate} from "./templates/table";
import fs = require('fs');
import path = require('path');

const config = {
	user: 'postgres',
	database: 'postgres',
	password: 'password',
	host: 'localhost',
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
};

const pool = new Pool(config);

type sql_identifier = string;
// type cardinal_number = number;
// type character_data = string;
// type yes_or_no = 'YES'|'NO';

interface ColumnUdtUsageRow {
	udt_catalog : sql_identifier;
	udt_schema : sql_identifier;
	udt_name : sql_identifier;
	table_catalog : sql_identifier;
	table_schema : sql_identifier;
	table_name : sql_identifier;
	column_name : sql_identifier;
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

	constructor(public name : string) {

	}
}

export class TableMetadata {
	public columns = new DefaultMap<string, ColumnMetadata>((key : string) => new ColumnMetadata(key));

	constructor(public name : string) {
	}
}

const SCHEMA = 'public';

class MetadataClient {
	constructor(private client : Client) {

	}

	private populateColumnTypes(tablesMetadata : Map<string, TableMetadata>) : Promise<void> {
		return this.client.query(`SELECT * FROM "information_schema"."column_udt_usage" WHERE "table_schema" = '${ SCHEMA }'`)
			.then((result : QueryResult) => {
				const rows : ColumnUdtUsageRow[] = result.rows;
				rows.forEach((row) => {
					const tableMetadata = tablesMetadata.get(row.table_name);
					if (tableMetadata == undefined) throw new Error("Table metadata should never be undefined");
					const column : ColumnMetadata = tableMetadata.columns.get(row.column_name);
					if (column == undefined) throw new Error("Column metadata should never be undefined");
					column.type = row.udt_name;
				});
			});
	}

	getTableMetadata() : Promise<Map<string, TableMetadata>> {
		const tablesMetadata : Map<string, TableMetadata> = new DefaultMap<string, TableMetadata>((key : string) => new TableMetadata(key));
		return this.populateColumnTypes(tablesMetadata)
			.then(() => {
				return tablesMetadata;
			});
	}
}

function generateInterfaces(tablesMetadata : Map<string, TableMetadata>) : void {
	console.log(`Generating interfaces for ${ tablesMetadata.size } tables...`);
	for (const tableMetadata of tablesMetadata.values()) {
		const content = TableTemplate(tableMetadata);
		const rootDir = 'out';
		if (!fs.existsSync(rootDir)) {
			fs.mkdir(rootDir);
		}
		const outName = path.join(rootDir, `${ tableMetadata.name }.ts`);
		fs.writeFileSync(outName, content);
	}
}

function getTableMetadata(client : Client) {
	console.log(`Querying the database...`);
	const metadataClient = new MetadataClient(client);
	return metadataClient.getTableMetadata();
}

function main() : Promise<any> {
	const releasePool = () => {
		return pool.end();
	};
	return pool.connect()
		.then((client : Client) => {
			const cleanup = () => {
				client.release();
			};
			return getTableMetadata(client)
				.then(generateInterfaces)
				.then(cleanup, cleanup);
		}).then(releasePool, releasePool)
		.then(() => console.log("Done!"));
}

main();
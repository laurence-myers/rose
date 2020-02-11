import { Client } from "pg";
import { makeDirs } from "../lang";
import fs = require('fs');
import path = require('path');
import { TableMetadata, getTableMetadata } from "../codegen/dbmetadata";
import { generateTableCode } from "../codegen/generators";

const DEFAULT_URL = "postgresql://postgres:password@localhost:5432/postgres";

function generateInterfacesAndMetamodel(tablesMetadata: Map<string, TableMetadata>): void {
	console.log(`Generating interfaces and metamodels for ${ tablesMetadata.size } tables...`);
	for (const tableMetadata of tablesMetadata.values()) {
		const content = generateTableCode(tableMetadata);
		const rootDir = 'out';
		makeDirs(rootDir);
		const outName = path.join(rootDir, `${ tableMetadata.name }.ts`);
		fs.writeFileSync(outName, content);
	}
}

function wrapError(fn: () => Promise<any>): (err: Error) => Promise<any> {
	return (err: Error) => {
		return fn()
			.then(() => {
				throw err;
			});
	};
}

async function main(): Promise<any> {
	const client = new Client(DEFAULT_URL);
	const cleanup = () => {
		return new Promise((resolve, reject) => {
			try {
				client.end();
				return resolve();
			} catch (err) {
				return reject(err);
			}
		});
	};
	try {
		client.connect();
		console.log(`Querying the database...`);
		const tablesMetadata: Map<string, TableMetadata> = await getTableMetadata(client);
		generateInterfacesAndMetamodel(tablesMetadata);
		console.log("Done!")
	} catch (err) {
		console.error("Error encountered");
		console.error(err);
	} finally {
		await cleanup();
	}
}

if (require.main === module) {
	//noinspection JSIgnoredPromiseFromCall
	main();
}

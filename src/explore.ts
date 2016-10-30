import {Pool, Client} from "pg";
// import R = require('ramda');
import {makeDirs} from "./lang";
import {TableTemplate} from "./templates/table";
import fs = require('fs');
import path = require('path');
import {TableMetamodelTemplate} from "./templates/tableMetamodel";
import {TableMetadata, getTableMetadata} from "./dbmetadata";

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

function generateInterfaces(tablesMetadata : Map<string, TableMetadata>) : void {
	console.log(`Generating interfaces for ${ tablesMetadata.size } tables...`);
	for (const tableMetadata of tablesMetadata.values()) {
		const content = TableTemplate(tableMetadata);
		const rootDir = 'out';
		makeDirs(rootDir);
		const outName = path.join(rootDir, `${ tableMetadata.name }.ts`);
		fs.writeFileSync(outName, content);
	}
}

function generateTableMetamodel(tablesMetadata : Map<string, TableMetadata>) : void {
	console.log(`Generating table metamodel for ${ tablesMetadata.size } tables...`);
	for (const tableMetadata of tablesMetadata.values()) {
		const content = TableMetamodelTemplate(tableMetadata);
		const rootDir = 'out';
		makeDirs(rootDir);
		const outName = path.join(rootDir, `_${ tableMetadata.name }.ts`);
		fs.writeFileSync(outName, content);
	}
}

function wrapError(fn : () => Promise<any>) : (err : Error) => Promise<any> {
	return (err : Error) => {
		return fn()
			.then(() => {
				throw err;
			});
	};
}

function main() : Promise<any> {
	const releasePool = () => {
		return pool.end();
	};
	return pool.connect()
		.then((client : Client) => {
			const cleanup = () => {
				return new Promise((resolve, reject) => {
					try {
						client.release();
						return resolve();
					} catch (err) {
						return reject(err);
					}
				});
			};
			console.log(`Querying the database...`);
			return getTableMetadata(client)
				.then((tablesMetadata : Map<string, TableMetadata>) => {
					generateInterfaces(tablesMetadata);
					generateTableMetamodel(tablesMetadata);
				}).then(cleanup, wrapError(cleanup));
		}).then(releasePool, wrapError(releasePool))
		.then(() => console.log("Done!"),
			(err) => {
				console.error("Error encountered");
				console.error(err);
			});
}

main();
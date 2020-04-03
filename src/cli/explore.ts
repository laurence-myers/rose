import { Client } from "pg";
import { makeDirs } from "../lang";
import fs = require('fs');
import path = require('path');
import { TableMetadata, getTableMetadata } from "../codegen/dbmetadata";
import { generateTableCode } from "../codegen/generators";

enum ExitCode {
	Okay,
	UnhandledError,
	ErrorInCleanup,
	InvalidArguments
}

function generateInterfacesAndMetamodel(tablesMetadata: Map<string, TableMetadata>, options: CliOptions): void {
	for (const tableMetadata of tablesMetadata.values()) {
		const content = generateTableCode(tableMetadata);
		const rootDir = options.outDir;
		makeDirs(rootDir);
		const outName = path.join(rootDir, `${ tableMetadata.niceName }.ts`);
		fs.writeFileSync(outName, content);
	}
}

const cliOptionsConfig = [
	{
		long: 'url',
		short: 'u',
		description: 'The database URL',
		required: true,
	},
	{
		long: 'out',
		short: 'o',
		description: 'The output directory',
		required: true,
	},
	// {
	// 	long: 'help',
	// 	short: 'h',
	// 	description: 'Print the help for this tool',
	// 	required: false
	// }
] as const;

interface CliOptions {
	url: string;
	outDir: string;
}

function parseArgs(args: string[]): CliOptions | Error {
	let rawOptions: {
		[K in typeof cliOptionsConfig[number]['long']]?: string;
	} = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		for (const option of cliOptionsConfig) {
			if (arg === option.long || arg === option.short) {
				rawOptions[option.long] = args[++i];
			}
		}
	}

	for (const option of cliOptionsConfig) {
		if (option.required && !rawOptions[option.long]) {
			return new Error(`Please provide the required option "${ option.long }"`);
		}
	}

	return {
		url: rawOptions.url!,
		outDir: rawOptions.out!
	};
}

function getHelpString() {
	return `TODO`;
}

function isCliOptions(value: CliOptions | Error): value is CliOptions {
	return !(value instanceof Error);
}

async function main(): Promise<void> {
	let exitCode: ExitCode = ExitCode.Okay;
	let client: Client | undefined;
	const cleanup = () => {
		return new Promise((resolve, reject) => {
			try {
				if (client) {
					client.end();
				}
				return resolve();
			} catch (err) {
				if (exitCode === ExitCode.Okay) {
					exitCode = ExitCode.ErrorInCleanup;
				}
				return reject(err);
			}
		});
	};
	try {
		const args = parseArgs(process.argv.slice(2));
		if (isCliOptions(args)) {
			client = new Client(args.url);
			client.connect();
			console.log(`Querying the database...`);
			const tablesMetadata: Map<string, TableMetadata> = await getTableMetadata(client);
			console.log(`Generating interfaces and metamodels for ${ tablesMetadata.size } tables...`);
			generateInterfacesAndMetamodel(tablesMetadata, args);
			console.log("Done!");
			exitCode = ExitCode.Okay;
		} else {
			console.error(`Invalid arguments: ${ args.message }`);
			console.log(getHelpString());
			exitCode = ExitCode.InvalidArguments;
		}
	} catch (err) {
		console.error("Error encountered");
		console.error(err);
		exitCode = ExitCode.UnhandledError;
	} finally {
		await cleanup();
	}
	process.exitCode = exitCode;
}

if (require.main === module) {
	//noinspection JSIgnoredPromiseFromCall
	main();
}

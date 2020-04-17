#!/usr/bin/env node
import { Client } from "pg";
import { makeDirs } from "../lang";
import { getTableMetadata, TableMetadata } from "../codegen/dbmetadata";
import { generateTableCode } from "../codegen/generators";
import { mergeConfigWithDefaults, parseConfig } from "../config";
import fs = require('fs');
import path = require('path');

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
	{
		long: 'config',
		short: 'c',
		description: 'The config file',
		required: false
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
	configFileName?: string;
}

function parseArgs(args: string[]): CliOptions | Error {
	let rawOptions: {
		[K in typeof cliOptionsConfig[number]['long']]?: string;
	} = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		for (const option of cliOptionsConfig) {
			if (arg === '--' + option.long || arg === '-' + option.short) {
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
		outDir: rawOptions.out!,
		configFileName: rawOptions.config
	};
}

function getHelpString() {
	return `TODO`;
}

function isCliOptions(value: CliOptions | Error): value is CliOptions {
	return !(value instanceof Error);
}

async function main(rawArgs: string[]): Promise<ExitCode> {
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
		const args = parseArgs(rawArgs);
		if (isCliOptions(args)) {
			const config = mergeConfigWithDefaults(args.configFileName ? parseConfig(args.configFileName) : undefined);
			client = new Client(args.url);
			await client.connect();
			console.log(`Querying the database...`);
			const tablesMetadata: Map<string, TableMetadata> = await getTableMetadata(client, config);
			console.log(`Generating interfaces and metamodels for ${ tablesMetadata.size } tables...`);
			generateInterfacesAndMetamodel(tablesMetadata, args);
			console.log("Done!");
			return ExitCode.Okay;
		} else {
			console.error(`Invalid arguments: ${ args.message }`);
			console.log(getHelpString());
			return ExitCode.InvalidArguments;
		}
	} catch (err) {
		console.error("Error encountered");
		console.error(err);
		return ExitCode.UnhandledError;
	} finally {
		await cleanup();
	}
	return exitCode;
}

if (require.main === module) {
	//noinspection JSIgnoredPromiseFromCall
	main(process.argv.slice(2))
		.then((exitCode) => process.exitCode = exitCode)
		.catch(() => process.exitCode = 999);
}

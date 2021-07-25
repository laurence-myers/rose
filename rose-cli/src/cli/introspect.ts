#!/usr/bin/env node
import { Client } from "pg";
import { makeDirs } from "../lang";
import { getTableMetadata, TableMetadata } from "../codegen/dbmetadata";
import { generateTableCode } from "../codegen/generators";
import { mergeConfigWithDefaults, parseConfig } from "../config";
import fs = require("fs");
import path = require("path");

enum ExitCode {
	Okay,
	UnhandledError,
	ErrorInCleanup,
	InvalidArguments,
}

function generateInterfacesAndMetamodel(
	tablesMetadata: Map<string, TableMetadata>,
	options: CliOptions
): void {
	for (const tableMetadata of tablesMetadata.values()) {
		const content = generateTableCode(tableMetadata);
		const rootDir = options.outDir;
		makeDirs(rootDir);
		const outName = path.join(rootDir, `${tableMetadata.niceName}.ts`);
		fs.writeFileSync(outName, content);
	}
}

enum CliOptionType {
	String,
	Boolean,
}

const cliOptionsConfig = [
	{
		long: "url",
		short: "u",
		description: "The database URL",
		required: true,
		type: CliOptionType.String,
	},
	{
		long: "out",
		short: "o",
		description: "The output directory",
		required: true,
		type: CliOptionType.String,
	},
	{
		long: "config",
		short: "c",
		description: "The config file",
		required: false,
		type: CliOptionType.String,
	},
	{
		long: "help",
		short: "h",
		description: "Print this help text",
		required: false,
		type: CliOptionType.Boolean,
	},
] as const;

interface CliOptions {
	configFileName?: string;
	outDir: string;
	help?: boolean;
	url: string;
}

function parseArgs(args: string[]): CliOptions | Error {
	let rawOptions: {
		[K in typeof cliOptionsConfig[number]["long"]]?: string | boolean;
	} = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		for (const option of cliOptionsConfig) {
			if (arg === "--" + option.long || arg === "-" + option.short) {
				if (option.type === CliOptionType.Boolean) {
					rawOptions[option.long] = true;
				} else {
					rawOptions[option.long] = args[++i];
				}
			}
		}
	}

	for (const option of cliOptionsConfig) {
		if (option.required && !rawOptions[option.long]) {
			return new Error(`Please provide the required option "${option.long}"`);
		}
	}

	return {
		configFileName: rawOptions.config as string | undefined,
		outDir: rawOptions.out! as string,
		help: rawOptions.help as boolean | undefined,
		url: rawOptions.url! as string,
	};
}

function printHelp() {
	for (const option of cliOptionsConfig
		.slice()
		.sort((a, b) => a.short.localeCompare(b.short))) {
		console.log(`\t-${option.short}, --${option.long}`);
		if (option.required) {
			console.log(`\t\tREQUIRED`);
		}
		console.log(`\t\t${option.description}`);
	}
}

function isCliOptions(value: CliOptions | Error): value is CliOptions {
	return !(value instanceof Error);
}

async function main(rawArgs: string[]): Promise<ExitCode> {
	let exitCode: ExitCode = ExitCode.Okay;
	let client: Client | undefined;
	const cleanup = () => {
		return new Promise<void>((resolve, reject) => {
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
			const config = mergeConfigWithDefaults(
				args.configFileName ? await parseConfig(args.configFileName) : undefined
			);
			client = new Client(args.url);
			await client.connect();
			console.log(`Querying the database...`);
			const tablesMetadata: Map<string, TableMetadata> = await getTableMetadata(
				client,
				config
			);
			console.log(
				`Generating interfaces and metamodels for ${tablesMetadata.size} tables...`
			);
			generateInterfacesAndMetamodel(tablesMetadata, args);
			console.log("Done!");
			return ExitCode.Okay;
		} else {
			console.error(`Invalid arguments: ${args.message}`);
			printHelp();
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
		.then((exitCode) => (process.exitCode = exitCode))
		.catch(() => (process.exitCode = 999));
}

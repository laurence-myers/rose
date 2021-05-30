/**
 * Only works for PostgreSQL docs up to v12. From v13, the tables have been removed. :(
 *
 * To use:
 * - Go to the PostgreSQL docs page containing the functions, e.g. https://www.postgresql.org/docs/12/functions-aggregate.html
 * - In your browser, select and copy the rows of a table (excluding the header)
 * - Paste it into a CSV file, e.g. "funcs.csv"
 * - Run `yarn genFuncs funcs.csv`
 * - Move the file into `src/query/postgresql/functions/...?`, massage the contents
 */

import * as fs from "fs";

class ArgsError extends Error {}

async function parseArgs() {
	if (process.argv.length != 3) {
		throw new ArgsError("Please pass the file path of the docs table CSV.");
	} else {
		const filePath = process.argv[2];
		if (!fs.existsSync(filePath)) {
			throw new ArgsError("The CSV file does not appear to exist.");
		} else {
			return filePath;
		}
	}
}

interface FunctionArg {
	name: string;
	isOptional: boolean;
}

function argsSignatureTemplate(args: FunctionArg[]) {
	return args
		.map(
			(arg) =>
				`${arg.name}${
					arg.isOptional ? "?" : ""
				}: ParameterOrValueExpressionNode`
		)
		.join(", ");
}

function argsPassthroughTemplate(args: FunctionArg[]) {
	if (args.length === 0) {
		return "";
	}
	return ", " + args.map((arg) => `${arg.name}`).join(", ");
}

function functionTemplate(
	functionName: string,
	description: string,
	args: FunctionArg[]
) {
	return `/**
 * ${description}
 */
export function ${functionName}(${argsSignatureTemplate(
		args
	)}): FunctionExpressionNode {
	return createFunctionNode('${functionName}'${argsPassthroughTemplate(args)});
}
`;
}

function parseArg(arg: string, isOptional: boolean) {
	return {
		name: arg.split(" ")[0],
		isOptional,
	};
}

function parseFunctionArgs(args: string, isOptional: boolean) {
	if (!args) return [];
	return args.split(", ").map((arg) => parseArg(arg, isOptional));
}

async function generateFromCsv(csvFile: string): Promise<void> {
	const contents = fs.readFileSync(csvFile, "utf-8");
	const rows = contents.split("\n");
	const outputEntries = rows.map((row) => {
		if (!row) return;
		const split = row.split("\t");
		const funcSyntax = split[0];
		const descriptionIndex = 2;
		const description = split[descriptionIndex];
		const functionName = funcSyntax.substring(0, funcSyntax.indexOf("("));
		const argsBody = funcSyntax.substring(
			funcSyntax.indexOf("(") + 1,
			funcSyntax.indexOf(")")
		);
		const startOptionals = argsBody.indexOf("[,");
		let allArgs = [];
		const mandatoryArgs = argsBody
			.substring(0, startOptionals > -1 ? startOptionals : argsBody.length)
			.trim();
		allArgs.push(...parseFunctionArgs(mandatoryArgs, false));
		if (startOptionals > -1) {
			const optionalArgs = argsBody
				.substring(startOptionals + 3, argsBody.indexOf("]"))
				.trim();
			allArgs.push(...parseFunctionArgs(optionalArgs, true));
		}
		return functionTemplate(functionName, description, allArgs);
	});
	fs.writeFileSync(csvFile + ".ts", outputEntries.join("\n"));
}

async function main(): Promise<void> {
	console.log("Starting...");
	let exitCode = 0;
	try {
		const csvFile = await parseArgs();
		await generateFromCsv(csvFile);
		console.log("Done!");
	} catch (err) {
		console.error("Error", err);
		exitCode = 1;
	}
	process.exitCode = exitCode;
}

if (require.main === module) {
	//noinspection JSIgnoredPromiseFromCall
	main();
}

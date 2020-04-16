import { promises as fs } from 'fs';
import { join as pjoin } from 'path';
import * as arp from 'app-root-path';

enum ExitCode {
	Okay,
	UnhandledError
}

async function main(args: string[]): Promise<ExitCode> {
	let exitCode: ExitCode = ExitCode.Okay;
	const filesToCopy = [
		'package.json',
		'README.md'
	];
	for (const fileToCopy of filesToCopy) {
		console.log(`Copying ${ fileToCopy }...`);
		await fs.copyFile(pjoin(arp.path, fileToCopy), pjoin(arp.resolve('package'), fileToCopy));
	}
	return exitCode;
}

if (require.main === module) {
	//noinspection JSIgnoredPromiseFromCall
	main(process.argv.slice(2))
		.then((exitCode) => process.exitCode = exitCode)
		.catch((err) => {
			console.error(`Error encountered.`);
			console.error(err);
			process.exitCode = ExitCode.UnhandledError;
		});
}

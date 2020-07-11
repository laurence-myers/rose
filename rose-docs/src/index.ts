import asciidoctor from 'asciidoctor';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as arp from 'app-root-path';

enum ExitCode {
    Okay,
    UnhandledError
}

async function processFile(file: string): Promise<void> {
    console.log(`Converting ${ file }...`);
    const output = asciidoctor()
        .convert(await fs.readFile(file), {
            backend: 'html',
            // eslint-disable-next-line @typescript-eslint/camelcase
            base_dir: path.dirname(file),
            safe: 'UNSAFE',
            standalone: file.endsWith('index.adoc')
        });
    const outPath = file.replace(/([\\/])docs[\\/]/, '$1dist$1').replace(/\.adoc$/, '.html');
    await fs.mkdir(path.dirname(outPath), {
        recursive: true
    });
    await fs.writeFile(outPath, output);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main(_args: string[]): Promise<ExitCode> {
    const exitCode = ExitCode.Okay;

    // const files = await walk(path.join(arp.path, 'docs'));
    // await mapP(files, processFile);
    await processFile(path.join(arp.path, 'docs', 'index.adoc'));

    return exitCode;
}

if (require.main === module) {
    main(process.argv.slice(2))
        .then((exitCode) => process.exit(exitCode))
        .catch((err) => {
            console.error(err);
            process.exit(ExitCode.UnhandledError)
        });
}

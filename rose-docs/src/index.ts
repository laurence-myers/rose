import asciidoctor from 'asciidoctor';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as arp from 'app-root-path';

enum ExitCode {
    Okay,
    UnhandledError
}

/**
 * Derived from https://gist.github.com/lovasoa/8691344#gistcomment-2927279
 */
async function walk(dir: string): Promise<string[]> {
    const fileNames = await fs.readdir(dir);
    const files = (await Promise.all(fileNames.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            return walk(filePath);
        } else if (stats.isFile() && path.extname(filePath) === '.adoc') {
            return filePath;
        } else {
            return;
        }
    }))).filter((entry): entry is string | string[] => entry !== undefined);

    return files.reduce((all: string[], folderContents: string | string[]): string[] => all.concat(folderContents), []);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main(_args: string[]): Promise<ExitCode> {
    const exitCode = ExitCode.Okay;

    const files = await walk(path.join(arp.path, 'docs'));
    for (const file of files) {
        console.log(`Converting ${ file }...`);
        const output = await asciidoctor()
            .convert(await fs.readFile(file), {
                backend: 'html',
                // eslint-disable-next-line @typescript-eslint/camelcase
                base_dir: path.dirname(file),
                safe: 'UNSAFE'
            });
        const outPath = file.replace(/([\\/])docs[\\/]/, '$1dist$1').replace(/\.adoc$/, '.html');
        await fs.mkdir(path.dirname(outPath), {
            recursive: true
        });
        await fs.writeFile(outPath, output);
    }

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

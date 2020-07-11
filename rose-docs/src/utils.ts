import { promises as fs } from "fs";
import path from "path";

export function mapP<T, U>(values: T[], mapper: (value: T) => Promise<U>): Promise<U[]> {
	return Promise.all(
		values.map(mapper)
	);
}

/**
 * Derived from https://gist.github.com/lovasoa/8691344#gistcomment-2927279
 */
export async function walk(dir: string): Promise<string[]> {
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

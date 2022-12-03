import * as crypto from "crypto";
import type { XXHashAPI } from "xxhash-wasm";
import { MissingDependencyError } from "../errors";

export interface RowHasher<TDataClass = Record<string, any>> {
	(row: TDataClass, propertiesToHash: string[]): string;
}

const seed = Date.now();

let xxhash: XXHashAPI | undefined;

export let defaultRowHasher: RowHasher | undefined;

export async function getDefaultRowHasher(): Promise<RowHasher> {
	if (!defaultRowHasher) {
		try {
			const xxhashModule = await require("xxhash-wasm");
			xxhash = await (xxhashModule as unknown as () => Promise<XXHashAPI>)();
			defaultRowHasher = xxhashRowHasher;
		} catch (err) {
			console.warn(
				`Failed to import xxhash-wasm, default nested row hashing will fallback to SHA256.`
			);
			defaultRowHasher = sha256RowHasher;
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return defaultRowHasher!;
}

function xxhashRowHasher<TDataClass>(
	row: TDataClass,
	propertiesToHash: string[]
) {
	if (!xxhash) {
		throw new MissingDependencyError(
			`xxhash-wasm is not initialized, or could not be imported`
		);
	}
	const hash = xxhash.create64(BigInt(seed));
	for (const key of propertiesToHash) {
		hash.update(`${key}=${(<any>row)[key]};`);
	}
	return hash.digest().toString(16);
}

function sha256RowHasher<TDataClass>(
	row: TDataClass,
	propertiesToHash: string[]
) {
	const hash = crypto.createHash("sha256");
	for (const key of propertiesToHash) {
		hash.update(`${key}=${(<any>row)[key]};`);
	}
	return hash.digest().toString("hex");
}

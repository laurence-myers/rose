import * as crypto from "crypto";
import { MissingDependencyError } from "../errors";

export interface RowHasher<TDataClass = Record<string, any>> {
	(row: TDataClass, propertiesToHash: string[]): string;
}

const seed = Date.now();

let metrohash: typeof import("metrohash") | undefined;

export let defaultRowHasher = metrohashRowHasher;

try {
	metrohash = require("metrohash");
} catch (err) {
	console.warn(
		`Failed to import metrohash, default nested row hashing will fallback to SHA256.`
	);
	defaultRowHasher = sha256RowHasher;
}

export function metrohashRowHasher<TDataClass>(
	row: TDataClass,
	propertiesToHash: string[]
) {
	if (!metrohash) {
		throw new MissingDependencyError(`metrohash could not be imported`);
	}
	const hash = new metrohash.MetroHash128(seed);
	for (const key of propertiesToHash) {
		hash.update(`${key}=${(<any>row)[key]};`);
	}
	return hash.digest();
}

export function sha256RowHasher<TDataClass>(
	row: TDataClass,
	propertiesToHash: string[]
) {
	const hash = crypto.createHash("sha256");
	for (const key of propertiesToHash) {
		hash.update(`${key}=${(<any>row)[key]};`);
	}
	return hash.digest().toString("hex");
}

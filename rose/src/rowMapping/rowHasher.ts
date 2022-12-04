import * as crypto from "crypto";

/**
 * RowHasher is used to identify parent objects of nested objects within a query result.
 * It takes the row, and the names of properties on the row to hash. The hasher should iterate through the property
 * names and add the property values to the hash.
 * It should return a hex string representing the hash.
 * The default hashing algorithm is MD5.
 * You can replace the hashing function with your own implementation for a significant speedup, e.g. using
 * metrohash or xxhash (xxhash-wasm).
 */
export interface RowHasher<TDataClass = Record<string, any>> {
	(row: TDataClass, propertiesToHash: string[]): string;
}

let defaultRowHasher: RowHasher = md5RowHasher;

/**
 * Returns the hashing function used for "nested" objects within query results.
 */
export function getDefaultRowHasher(): RowHasher {
	return defaultRowHasher;
}

/**
 * Sets the hashing function used for "nested" objects within query results.
 */
export function setDefaultRowHasher(rowHasher: RowHasher) {
	defaultRowHasher = rowHasher;
}

function md5RowHasher<TDataClass>(row: TDataClass, propertiesToHash: string[]) {
	const hash = crypto.createHash("md5");
	for (const key of propertiesToHash) {
		hash.update(`${key}=${(<any>row)[key]};`);
	}
	return hash.digest().toString("hex");
}

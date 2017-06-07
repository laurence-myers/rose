declare module "metrohash" {
	export class MetroHash64 {
		// Constructor.
		constructor(seed? : number);

		// Update.
		update(input : string | Buffer) : this;

		// Finalize and get hash digest.
		digest() : string;
	}

	export class MetroHash128 {
		// Constructor.
		constructor(seed? : number);

		// Update.
		update(input : string | Buffer) : this;

		// Finalize and get hash digest.
		digest() : string;
	}

	export function metrohash64(input : string | Buffer, seed? : number) : string;

	export function metrohash128(input : string | Buffer, seed? : number) : string;
}

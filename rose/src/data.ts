import { DefaultMap } from "./lang";
import { MissingKeyError } from "./errors";

export class TableMap extends DefaultMap<string, string> {
	protected defaultedCounter: number = 0;

	constructor() {
		super(() => {
			this.defaultedCounter++;
			return `t${this.defaultedCounter}`;
		});
	}
}

export class ImmutableMap<K, V> implements ReadonlyMap<K, V> {
	protected readonly map: Map<K, V>;

	constructor(values: Iterable<[K, V]>) {
		this.map = new Map(values);
	}

	get size(): number {
		return this.map.size;
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.map[Symbol.iterator]();
	}

	entries(): IterableIterator<[K, V]> {
		return this.map.entries();
	}

	forEach(
		callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
		thisArg?: any
	): void {
		return this.map.forEach(callbackfn, thisArg);
	}

	get(key: K): V {
		if (!this.map.has(key)) {
			throw new MissingKeyError(`Map does not have a value for key: "${key}"`);
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.map.get(key)!;
	}

	has(key: K): boolean {
		return this.map.has(key);
	}

	keys(): IterableIterator<K> {
		return this.map.keys();
	}

	values(): IterableIterator<V> {
		return this.map.values();
	}
}

export function convertObjectToMap<K extends string, V>(
	values: { [key in K]: V }
) {
	return new ImmutableMap(Object.entries(values));
}

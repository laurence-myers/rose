import fs = require('fs');

export class DefaultMap<K, V> extends Map<K, V> {
	constructor(private defaultValueFactory: (key: K, map: Map<K, V>) => V, iterable?: [K, V][] | Iterable<[K, V]>) {
		super(<any> iterable); // have to cast to any; current ES6 type defs don't seem to support Iterable.
	}

	get(key: K): V {
		if (!this.has(key)) {
			const value = this.defaultValueFactory(key, this);
			this.set(key, value);
			return value;
		} else {
			return <V> super.get(key); // should never be undefined
		}
	}
}

/**
 * Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
	// Retrieve the property names defined on obj
	const propNames = Object.getOwnPropertyNames(obj);

	// Freeze properties before freezing self
	propNames.forEach((name: string) => {
		const prop: any = (<any> obj)[name];

		// Freeze prop if it is an object
		if (typeof prop == 'object' && prop !== null) {
			deepFreeze(prop);
		}
	});

	// Freeze self (no-op if already frozen)
	return Object.freeze(obj);
}

export function makeDirs(fullPath: string): void {
	fs.mkdirSync(fullPath, { recursive: true });
}

export function assertNever(arg: never): never {
	throw new Error(`Unexpected object: ${ (<any> arg).constructor || arg }`);
}

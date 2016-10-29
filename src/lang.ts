import R = require('ramda');

export class DefaultMap<K, V> extends Map<K, V> {
	constructor(private defaultValueFactory : (key : K) => V, iterable?: [K, V][]) {
		super(iterable);
	}

	get(key : K) : V {
		if (!this.has(key)) {
			const value = this.defaultValueFactory(key);
			this.set(key, value);
			return value;
		} else {
			return <V> super.get(key); // should never be undefined
		}
	}
}

export function objectToMap<T>(object : { [key : string] : T }) : Map<string, T> {
	return new Map<string, T>(R.toPairs<string, T>(object));
}
const fs = require('fs');
const path = require('path');

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

export function makeDirs(fullPath : string) : void {
	const split = fullPath.split(path.sep);
	let pathToMake = '';
	for (let pathPart of split) {
		pathToMake += pathPart;
		if (!fs.existsSync(pathToMake)) {
			fs.mkdirSync(pathToMake);
		}
	}
}
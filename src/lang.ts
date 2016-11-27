import "reflect-metadata";
import fs = require('fs');
import path = require('path');

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

/**
 * Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T>(obj : T) : T {
	// Retrieve the property names defined on obj
	const propNames = Object.getOwnPropertyNames(obj);

	// Freeze properties before freezing self
	propNames.forEach((name : string) => {
		const prop : any = (<any> obj)[name];

		// Freeze prop if it is an object
		if (typeof prop == 'object' && prop !== null) {
			deepFreeze(prop);
		}
	});

	// Freeze self (no-op if already frozen)
	return Object.freeze(obj);
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

export function getMetadata<T>(metadataKey : string, target : Object, targetKey? : string | symbol) : T | undefined {
	if (targetKey) {
		return Reflect.getMetadata(metadataKey, target, targetKey);
	} else {
		return Reflect.getMetadata(metadataKey, target);
	}
}

export function getType(target : Object, propertyKey : string | symbol) : Function {
	const type = getMetadata<Function>("design:type", target, propertyKey);
	if (type === undefined) {
		throw new TypeError(`Could not find a type for property ${ propertyKey }`);
	}
	return type;
}

export function assertNever(arg : never) : never {
	throw new Error(`Unexpected object: ${ (<any> arg).constructor || arg }`);
}
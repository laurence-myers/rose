import "reflect-metadata";
import cloneDeep = require("lodash.clonedeep");
import fs = require('fs');
import path = require('path');
import * as util from "util";

export class DefaultMap<K, V> extends Map<K, V> {
	constructor(private defaultValueFactory : (key : K, map : Map<K, V>) => V, iterable?: [K, V][] | Iterable<[K, V]>) {
		super(<any> iterable); // have to cast to any; current ES6 type defs don't seem to support Iterable.
	}

	get(key : K) : V {
		if (!this.has(key)) {
			const value = this.defaultValueFactory(key, this);
			this.set(key, value);
			return value;
		} else {
			return <V> super.get(key); // should never be undefined
		}
	}
}

export class SettingMap<K, V> extends Map<K, V> {
	getOrSet(key : K, value : V) : V {
		if (!this.has(key)) {
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
export function deepFreeze<T>(obj : T) : Readonly<T> {
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
		throw new TypeError(`Could not find a type for property ${ String(propertyKey) }`);
	}
	return type;
}

export function assertNever(arg : never) : never {
	throw new Error(`Unexpected object: ${ (<any> arg).constructor || arg }`);
}

export function remove<T>(arr : T[], obj : T) : void {
	const index = arr.indexOf(obj);
	if (index > -1) {
		arr.splice(index, 1);
	}
}

export function difference<T>(setA : Set<T>, setB : Set<T>) : Set<T> {
	return new Set([...setA].filter((value) => !setB.has(value)));
}

export function keySet<T>(map : Map<T, any>) : Set<T> {
	return new Set(map.keys());
}

export function logObject(obj : any): void {
	console.log(util.inspect(obj, false, <any> null));
}

export function last<T>(arr : T[]) : T {
	return arr[arr.length - 1];
}

export function isMap<K, V>(obj : any) : obj is Map<K, V> {
	return obj instanceof Map;
}

export function clone<T>(obj : T) : T {
	return cloneDeep(obj);
}

function isFunction(value : any) : value is Function {
	return typeof(value) === 'function';
}

export function Clone() : MethodDecorator {
	return function<O, K extends keyof O, T>(target: O, propertyKey: K | string | symbol, descriptor: TypedPropertyDescriptor<T>) : TypedPropertyDescriptor<T> | void {
		const original = descriptor.value;
		if (isFunction(original)) {
			descriptor.value = function(this : any, ...args : any[]) {
				const newObj = clone(this);
				return original.apply(newObj, args);
			} as any;
		}
		return descriptor;
	};
}

export type Constructor<T> = { new() : T };

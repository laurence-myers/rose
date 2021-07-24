import cloneDeep = require("lodash.clonedeep");
import * as util from "util";

export class DefaultMap<K, V> extends Map<K, V> {
	constructor(
		private defaultValueFactory: (key: K, map: Map<K, V>) => V,
		iterable?: [K, V][] | Iterable<[K, V]>
	) {
		super(<any>iterable); // have to cast to any; current ES6 type defs don't seem to support Iterable.
	}

	get(key: K): V {
		if (!this.has(key)) {
			const value = this.defaultValueFactory(key, this);
			this.set(key, value);
			return value;
		} else {
			return <V>super.get(key); // should never be undefined
		}
	}
}

export class SettingMap<K, V> extends Map<K, V> {
	getOrSet(key: K, value: V): V {
		if (!this.has(key)) {
			this.set(key, value);
			return value;
		} else {
			return <V>super.get(key); // should never be undefined
		}
	}
}

export function coerceNullToUndefined<T>(value: T | null): T | undefined {
	return value === null ? undefined : value;
}

/**
 * Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
	// Retrieve the property names defined on obj
	const propNames = Object.getOwnPropertyNames(obj);

	// Freeze properties before freezing self
	propNames.forEach((name: string) => {
		const prop: any = (<any>obj)[name];

		// Freeze prop if it is an object
		if (typeof prop == "object" && prop !== null) {
			deepFreeze(prop);
		}
	});

	// Freeze self (no-op if already frozen)
	return Object.freeze(obj);
}

export function assertNever(arg: never): never {
	throw new Error(`Unexpected object: ${(<any>arg).constructor || arg}`);
}

export function remove<T>(arr: T[], obj: T): void {
	const index = arr.indexOf(obj);
	if (index > -1) {
		arr.splice(index, 1);
	}
}

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	return new Set([...setA].filter((value) => !setB.has(value)));
}

export function union<TA, TB>(setA: Set<TA>, setB: Set<TB>): Set<TA | TB> {
	return new Set([...setA, ...setB]);
}

export function keySet<T>(map: Map<T, any>): Set<T> {
	return new Set(map.keys());
}

export function safeKeys<T extends object>(object: T): Array<keyof T> {
	return Object.keys(object) as Array<keyof T>;
}

export function sortedPopulatedKeys<T extends { [k: string]: unknown }>(
	object: T
): Array<keyof T & string> {
	const objectKeys = [];
	for (const key in object) {
		if (
			Object.prototype.hasOwnProperty.call(object, key) &&
			object[key] !== undefined
		) {
			objectKeys.push(key);
		}
	}
	objectKeys.sort();
	return objectKeys;
}

export function logObject(obj: any): void {
	console.log(util.inspect(obj, false, <any>null));
}

export function last<T>(arr: T[]): T {
	return arr[arr.length - 1];
}

export function isMap<K, V>(obj: any): obj is Map<K, V> {
	return obj instanceof Map;
}

export function clone<T>(obj: T): T {
	return cloneDeep(obj);
}

function isFunction(value: any): value is Function {
	return typeof value === "function";
}

export function Clone(): MethodDecorator {
	return function <O, K extends keyof O, T>(
		target: O,
		propertyKey: K | string | symbol,
		descriptor: TypedPropertyDescriptor<T>
	): TypedPropertyDescriptor<T> | void {
		const original = descriptor.value;
		if (isFunction(original)) {
			descriptor.value = function (this: any, ...args: any[]) {
				const newObj = clone(this);
				return original.apply(newObj, args);
			} as any;
		}
		return descriptor;
	};
}

/**
 * Given an arg, which can be either a value or an array of values, and a second array of values,
 * returns a single (concatenated) array.
 */
export function rectifyVariadicArgs<T>(
	first: T | readonly T[],
	rest: readonly T[]
): T[] {
	return (Array.isArray(first) ? first : [first]).concat(rest);
}

export type Constructor<T> = { new (): T };

/**
 * https://stackoverflow.com/a/48244432/953887
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
	U[keyof U];

export function hasAtLeastOneKey<T>(obj: T): obj is AtLeastOne<T> {
	return Object.keys(obj).length > 0;
}

type NullablePropertyKeys<T> = {
	[K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type NonNullablePropertyKeys<T> = {
	[K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

/**
 * Allows substituting "undefined" for null properties, or omitting them completely.
 */
export type OptionalNulls<T> = Pick<T, NonNullablePropertyKeys<T>> &
	Partial<Pick<T, NullablePropertyKeys<T>>>;

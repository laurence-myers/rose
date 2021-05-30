import { ConstantNode } from "./ast";
import { param } from "./dsl";

export type ParamsProxy<T> = {
	readonly [K in keyof T]: ConstantNode<T[K]>;
};

export class ParamsWrapper<P> {
	get<R>(getter: (params: P) => R): ConstantNode<R> {
		return param(getter);
	}
}

export function params<T = never>(): ParamsProxy<T> {
	return new Proxy(
		{},
		{
			get(target: {}, key: keyof T): any {
				return param((p: T) => p[key]);
			},
		}
	) as ParamsProxy<T>;
}

export function withParams<T = never>() {
	// Dumb workaround so that we can infer U but require T to be specified
	return function <U>(cb: (p: ParamsProxy<T>) => U) {
		return cb(params<T>());
	};
}

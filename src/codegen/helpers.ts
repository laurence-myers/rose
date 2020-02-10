import {isNullOrUndefined} from "util";

export function iff(condition: boolean, body: () => string, elseBody? : () => string) {
	if (condition) {
		return body();
	} else {
		return elseBody ? elseBody() : '';
	}
}

export function exists(obj: any, body: () => string, elseBody? : () => string) {
	return iff(!isNullOrUndefined(obj), body, elseBody);
}

export function mmap<T>(list: T[], cb: (entry: T) => string, separator: string = '') {
	return list.map(cb).join(separator);
}

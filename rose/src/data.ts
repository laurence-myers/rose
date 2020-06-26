import { DefaultMap } from "./lang";

export class TableMap extends DefaultMap<string, string> {
	protected defaultedCounter = 0;

	constructor() {
		super((key, map) => `t${ (++this.defaultedCounter) }`);
	}
}

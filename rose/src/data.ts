import { DefaultMap } from "./lang";

export class TableMap extends DefaultMap<string, string> {
	protected defaultedCounter: number = 0;

	constructor() {
		super(() => {
			this.defaultedCounter++;
			return `t${this.defaultedCounter}`;
		});
	}
}

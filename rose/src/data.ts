import { DefaultMap } from "./lang";

export class TableMap extends DefaultMap<string, string> {
	protected defaultedCounter: number = 0;

	constructor(
	) {
		super((key, map) => {
			this.defaultedCounter++;
			return `t${ (this.defaultedCounter) }`;
		});
	}
}

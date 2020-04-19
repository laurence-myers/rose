import { DefaultMap } from "./lang";

export class TableMap extends DefaultMap<string, string> {
	constructor() {
		super((key, map) => `t${ map.size + 1 }`);
	}
}

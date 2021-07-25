import { Queryable } from "@rosepg/rose";

export function dummyClient<T>(rows: T[]): Queryable {
	return {
		async query(_queryText: string, _values: never[]) {
			return {
				rows,
				command: ``,
				oid: 1,
				rowCount: rows.length,
				fields: [],
			};
		},
	};
}

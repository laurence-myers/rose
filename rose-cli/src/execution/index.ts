import { QueryResult } from "pg";

export interface Queryable {
	query(queryText: string, values: any[]): Promise<QueryResult>;
}

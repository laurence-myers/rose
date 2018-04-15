import {QueryResult} from "pg";
import {GeneratedQuery} from "../query/dsl";
import {mapRowsToClass} from "../rowMapping/rowMapping";
import {SelectOutputExpression} from "../query/ast";

export interface Queryable {
	query(queryText : string, values : any[]) : Promise<QueryResult>;
}

export async function execute<TDataClass>(queryable : Queryable,
										  query : GeneratedQuery,
										  outputClass : { new() : TDataClass },
										  selectOutputExpressions : SelectOutputExpression[]) {
	const queryResult = await queryable.query(query.sql, query.parameters);
	return mapRowsToClass(selectOutputExpressions, queryResult.rows);
}
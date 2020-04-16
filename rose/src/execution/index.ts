import { QueryResult } from "pg";
import { mapRowsToClass } from "../rowMapping/rowMapping";
import { SelectOutputExpression } from "../query/ast";
import { QuerySelector } from "../query/querySelector";
import { MappedQuerySelector } from "../query/typeMapping";
import { GeneratedQuery } from "../query/preparedQuery";

export interface Queryable {
	query(queryText: string, values: any[]): Promise<QueryResult>;
}

export async function execute<T extends QuerySelector>(
	queryable: Queryable,
	query: GeneratedQuery,
	querySelector: T,
	selectOutputExpressions: SelectOutputExpression[]
): Promise<MappedQuerySelector<T>[]> {
	const queryResult = await queryable.query(query.sql, query.parameters);
	return mapRowsToClass<T>(selectOutputExpressions, queryResult.rows);
}

export async function executeNonReturning(
	queryable: Queryable,
	query: GeneratedQuery,
): Promise<void> {
	await queryable.query(query.sql, query.parameters);
}

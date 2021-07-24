import { CommonTableExpressionBuilder, SelectQueryBuilder } from "../builders";
import { WithNode } from "../ast";

/**
 * Wraps SELECT/INSERT/UPDATE/DELETE queries in a common table expression, which
 * can then be passed to another SELECT/INSERT/UPDATE/DELETE query.
 */
export function withCte(
	name: string,
	query: WithNode["query"] | SelectQueryBuilder<any>
): CommonTableExpressionBuilder {
	return new CommonTableExpressionBuilder(name, query);
}

/**
 * Alias for `withCte`
 * @see withCte
 */
export const with_ = withCte;

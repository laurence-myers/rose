import {
	BuildableJoin,
	InitialJoinBuilder,
	Joinable,
	OnOrUsingJoinBuilder,
} from "../builders/join";
import { QuerySelector } from "../querySelector";

/**
 * Starts building a join. The type of join is determined by the next method call.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link InitialJoinBuilder}
 * @see {@link Joinable}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function join<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): InitialJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(joinable);
}

/**
 * Starts building a full join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link Joinable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function fullJoin<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(joinable).full();
}

/**
 * Starts building an inner join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link Joinable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function innerJoin<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(joinable).inner();
}

/**
 * Starts building a left join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link Joinable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function leftJoin<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(joinable).left();
}

/**
 * Starts building a right join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link Joinable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function rightJoin<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(joinable).right();
}

/**
 * Starts building a cross join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param joinable The target joinable.
 * @see {@link BuildableJoin}
 * @see {@link Joinable}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function crossJoin<TQuerySelector extends QuerySelector>(
	joinable: Joinable<TQuerySelector>
): BuildableJoin<TQuerySelector> {
	return new InitialJoinBuilder(joinable).cross();
}

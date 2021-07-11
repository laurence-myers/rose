import {
	BuildableJoin,
	InitialJoinBuilder,
	Joinable,
	OnOrUsingJoinBuilder,
} from "../builders/join";

/**
 * Starts building a join. The type of join is determined by the next method call.
 *
 * A join can be used as a "from item" in some commands, e.g.
 * {@link SelectQueryBuilder.from}, {@link UpdateQueryBuilder.from}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link Fromable}
 * @see {@link InitialJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function join(
	leftFrom: Joinable,
	rightFrom: Joinable
): InitialJoinBuilder {
	return new InitialJoinBuilder(leftFrom, rightFrom);
}

/**
 * Starts building a full join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link Fromable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function fullJoin(
	leftFrom: Joinable,
	rightFrom: Joinable
): OnOrUsingJoinBuilder {
	return join(leftFrom, rightFrom).full();
}

/**
 * Starts building an inner join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link Fromable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function innerJoin(
	leftFrom: Joinable,
	rightFrom: Joinable
): OnOrUsingJoinBuilder {
	return join(leftFrom, rightFrom).inner();
}

/**
 * Starts building a left join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link Fromable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function leftJoin(
	leftFrom: Joinable,
	rightFrom: Joinable
): OnOrUsingJoinBuilder {
	return join(leftFrom, rightFrom).left();
}

/**
 * Starts building a right join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link Fromable}
 * @see {@link OnOrUsingJoinBuilder}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function rightJoin(
	leftFrom: Joinable,
	rightFrom: Joinable
): OnOrUsingJoinBuilder {
	return join(leftFrom, rightFrom).right();
}

/**
 * Starts building a cross join.
 *
 * Joins can be used in some commands, e.g. {@link SelectQueryBuilder.join}.
 *
 * @category DSL - Joins
 * @param leftFrom The "left" from item.
 * @param rightFrom The "right" from item.
 * @see {@link BuildableJoin}
 * @see {@link Fromable}
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export function crossJoin(
	leftFrom: Joinable,
	rightFrom: Joinable
): BuildableJoin {
	return join(leftFrom, rightFrom).cross();
}

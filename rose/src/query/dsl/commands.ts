import { QuerySelector } from "../querySelector";
import { SelectQueryBuilder } from "../builders/select";
import {
	PartialTableColumns,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand,
} from "../metamodel";
import { DeleteQueryBuilder } from "../builders/delete";
import { UpdateQueryBuilder } from "../builders/update";
import { InsertQueryBuilder } from "../builders/insert";
import { param } from "./core";
import { hasAtLeastOneKey, safeKeys } from "../../lang";
import { InvalidUpdateError } from "../../errors";
import { BeginCommandBuilder } from "../builders/begin";
import { CommitCommandBuilder } from "../builders/commit";
import { RollbackCommandBuilder } from "../builders/rollback";

/**
 * Starts building a "BEGIN" command.
 *
 * Finish building the query by calling {@link BeginCommandBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @see https://www.postgresql.org/docs/13/sql-begin.html
 */
export function begin() {
	return new BeginCommandBuilder();
}

/**
 * Starts building a "COMMIT" command.
 *
 * Finish building the query by calling {@link CommitCommandBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @see https://www.postgresql.org/docs/13/sql-commit.html
 */
export function commit() {
	return new CommitCommandBuilder();
}

/**
 * Starts building a "DELETE" command.
 *
 * Finish building the query by calling {@link DeleteQueryBuilder.finalise | `finalise()`}.
 *
 * This is named `deleteFrom()` instead of `delete()`, to avoid conflicts with the JavaScript keyword `delete`.
 *
 * @category DSL - Commands
 * @param table The table (metamodel) that you wish to delete from.
 * @see https://www.postgresql.org/docs/13/sql-delete.html
 */
export function deleteFrom(table: QueryTable) {
	return new DeleteQueryBuilder(table);
}

/**
 * Starts building an "INSERT" command.
 *
 * Finish building the query by calling {@link DeleteQueryBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @param table The table (metamodel) that you wish to insert into.
 * @see https://www.postgresql.org/docs/13/sql-insert.html
 * @typeParam TQTable The specific type of the table metamodel. Usually, this is inferred from `table`.
 * @typeParam TInsertRow The type of objects allowed to be inserted. This is derived from `TQTable`, and usually inferred.
 */
export function insert<
	TQTable extends QueryTable,
	TInsertRow extends TableColumnsForInsertCommand<TQTable>
>(table: TQTable) {
	return new InsertQueryBuilder<TQTable, TInsertRow>(table);
}

/**
 * Starts building an "INSERT" command, dynamically generating the columns & values from the given object.
 * The property names of the object must match the property names of the table metamodel.
 * Inserting multiple rows (from multiple objects) is supported, by calling `.insert()` multiple times. However, all
 * objects must have the same properties. Optional properties should be present, but have a value of `undefined`.
 *
 * @category DSL - Commands
 * @param table The table (metamodel) that you wish to insert into.
 * @param values The object representing a row to insert. Each key must match a property name from the table metamodel.
 * @see https://www.postgresql.org/docs/13/sql-insert.html
 * @typeParam TQTable The specific type of the table metamodel. Usually, this is inferred from `table`.
 * @typeParam TInsertRow The type of objects allowed to be inserted. This is derived from `TQTable`, and usually inferred.
 */
export function insertFromObject<
	TQTable extends QueryTable,
	TInsertRow extends Partial<TableColumns<TQTable>>
>(table: TQTable, values: TInsertRow) {
	const sqlValues: Partial<TInsertRow> = {};
	for (const key of safeKeys(values)) {
		(sqlValues as any)[key as any] = param(() => values[key]);
	}

	return insert<TQTable, TableColumnsForInsertCommand<TQTable>>(table).insert(
		sqlValues as any as TableColumnsForInsertCommand<TQTable>
	);
}

/**
 * Starts building a "ROLLBACK" command.
 *
 * Finish building the query by calling {@link RollbackCommandBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @see https://www.postgresql.org/docs/13/sql-rollback.html
 */
export function rollback() {
	return new RollbackCommandBuilder();
}

/**
 * Starts building a "SELECT" command.
 *
 * Finish building the query by calling {@link SelectQueryBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @param querySelector An object representing the values to select. Keys are aliases, values can be column
 *   metamodels, expression nodes (including sub-queries), or nested selector objects.
 * @see https://www.postgresql.org/docs/13/sql-select.html
 * @typeParam TQuerySelector The specific type of the query selector. Usually, this is inferred from `querySelector`.
 */
export function select<TQuerySelector extends QuerySelector>(
	querySelector: TQuerySelector
): SelectQueryBuilder<TQuerySelector> {
	return new SelectQueryBuilder<TQuerySelector>(querySelector);
}

/**
 * Starts building an "UPDATE" command.
 *
 * Finish building the query by calling {@link UpdateQueryBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @param table The table (metamodel) that you wish to update.
 * @see https://www.postgresql.org/docs/13/sql-update.html
 * @typeParam TQTable The specific type of the table metamodel. Usually, this is inferred from `table`.
 */
export function update<TQTable extends QueryTable>(table: TQTable) {
	return new UpdateQueryBuilder<TQTable>(table);
}

/**
 * Starts building an "UPDATE" command, dynamically generating the columns & values from the given object.
 *
 * Finish building the query by calling {@link UpdateQueryBuilder.finalise | `finalise()`}.
 *
 * @category DSL - Commands
 * @param table The table (metamodel) that you wish to update.
 * @param updates The object representing values to update. Each key must match a property name from the table metamodel.
 * @see https://www.postgresql.org/docs/13/sql-update.html
 * @throws {@link InvalidUpdateError} If `updates` is an empty object, or has no keys.
 * @typeParam TQTable The specific type of the table metamodel. Usually, this is inferred from `table`.
 */
export function updateFromObject<TQTable extends QueryTable>(
	table: TQTable,
	updates: PartialTableColumns<TQTable>
) {
	const sqlSets: Partial<TableColumnsForUpdateCommand<TQTable>> = {};
	for (const key of safeKeys(updates)) {
		sqlSets[key] = param(() => updates[key]);
	}

	if (!hasAtLeastOneKey(sqlSets)) {
		// keeps TSC happy
		throw new InvalidUpdateError(
			`Update objects must have at least one property.`
		);
	}

	return update<TQTable>(table) // TODO: enforce columns to update are in params
		.set(sqlSets);
}

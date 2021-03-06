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

export function begin() {
	return new BeginCommandBuilder();
}

export function commit() {
	return new CommitCommandBuilder();
}

export function deleteFrom<TParams>(table: QueryTable) {
	return new DeleteQueryBuilder(table);
}

export function insert<
	TQTable extends QueryTable,
	TInsertRow extends TableColumnsForInsertCommand<TQTable>
>(table: TQTable) {
	return new InsertQueryBuilder<TQTable, TInsertRow>(table);
}

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

export function rollback() {
	return new RollbackCommandBuilder();
}

export function select<TQuerySelector extends QuerySelector>(
	querySelector: TQuerySelector
): SelectQueryBuilder<TQuerySelector> {
	return new SelectQueryBuilder<TQuerySelector>(querySelector);
}

export function update<TQTable extends QueryTable>(table: TQTable) {
	return new UpdateQueryBuilder<TQTable>(table);
}

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

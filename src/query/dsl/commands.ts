import { QuerySelector } from "../querySelector";
import { SelectQueryBuilder } from "../builders/select";
import {
	PartialTableColumns,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand
} from "../metamodel";
import { DeleteQueryBuilder } from "../builders/delete";
import { UpdateQueryBuilder } from "../builders/update";
import { InsertQueryBuilder } from "../builders/insert";
import { param } from "./core";
import { hasAtLeastOneKey, safeKeys } from "../../lang";
import { InvalidUpdateError } from "../../errors";

export function deleteFrom<TParams>(table: QueryTable) {
	return new DeleteQueryBuilder(table);
}

export function insert<
	TQTable extends QueryTable,
	TInsertRow extends TableColumnsForInsertCommand<TQTable>,
	TParams
>(
	table: TQTable
) {
	return new InsertQueryBuilder<TQTable, TInsertRow, TParams>(table);
}

export function insertFromObject<
	TQTable extends QueryTable,
	TInsertRow extends Partial<TableColumns<TQTable>>,
	TParams
	>(
	table: TQTable,
	values: TInsertRow
) {
	const sqlValues: Partial<TInsertRow> = {};
	for (const key of safeKeys(values)) {
		(sqlValues as any)[key as any] = param(() => values[key]);
	}

	return insert<TQTable, TableColumnsForInsertCommand<TQTable>, TParams>(table)
		.insert(sqlValues as any as TableColumnsForInsertCommand<TQTable>);
}

export function select<TQuerySelector extends QuerySelector, TParams>(querySelector: TQuerySelector): SelectQueryBuilder<TQuerySelector, TParams> {
	return new SelectQueryBuilder<TQuerySelector, TParams>(querySelector);
}

export function update<TQTable extends QueryTable, TParams>(table: TQTable) {
	return new UpdateQueryBuilder<TQTable, TParams>(table);
}

export function updateFromObject<TQTable extends QueryTable, TParams>(table: TQTable, updates: PartialTableColumns<TQTable>) {
	const sqlSets: Partial<TableColumnsForUpdateCommand<TQTable>> = {};
	for (const key of safeKeys(updates)) {
		sqlSets[key] = param(() => updates[key]);
	}

	if (!hasAtLeastOneKey(sqlSets)) { // keeps TSC happy
		throw new InvalidUpdateError(`Update objects must have at least one property.`);
	}

	return update<TQTable, TParams & PartialTableColumns<TQTable>>(table)
		.set(sqlSets);
}

import { QuerySelector } from "../querySelector";
import { SelectQueryBuilder } from "../builders/select";
import { QueryTable, TableColumnsForUpdateCommand } from "../metamodel";
import { DeleteQueryBuilder } from "../builders/delete";
import { UpdateQueryBuilder } from "../builders/update";
import { InsertQueryBuilder } from "../builders/insert";

export function deleteFrom<TParams>(table: QueryTable) {
	return new DeleteQueryBuilder(table);
}

export function insert<
	TQTable extends QueryTable,
	TInsertRow extends TableColumnsForUpdateCommand<TQTable>,
	TParams
>(
	table: TQTable
) {
	return new InsertQueryBuilder<TQTable, TInsertRow, TParams>(table);
}

export function select<TQuerySelector extends QuerySelector, TParams>(querySelector: TQuerySelector): SelectQueryBuilder<TQuerySelector, TParams> {
	return new SelectQueryBuilder<TQuerySelector, TParams>(querySelector);
}

export function update<TQTable extends QueryTable, TParams>(table: TQTable) {
	return new UpdateQueryBuilder<TQTable, TParams>(table);
}

import { QuerySelector } from "../querySelector";
import { SelectQueryBuilder } from "../builders/select";
import { QueryTable } from "../metamodel";
import { DeleteQueryBuilder } from "../builders/delete";

export function deleteFrom<TParams>(table: QueryTable) {
	return new DeleteQueryBuilder(table);
}

export function select<TQuerySelector extends QuerySelector, TParams>(querySelector: TQuerySelector): SelectQueryBuilder<TQuerySelector, TParams> {
	return new SelectQueryBuilder<TQuerySelector, TParams>(querySelector);
}

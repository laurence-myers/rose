import {NumericColumnMetamodel, QueryTable, StringColumnMetamodel, TableMetamodel} from "../src/query/metamodel";
import {deepFreeze} from "../src/lang";

export class TUsers extends QueryTable {
	$table = new TableMetamodel("Users", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	locationId = new NumericColumnMetamodel(this.$table, "locationId", Number);
	name = new StringColumnMetamodel(this.$table, "name", String);
}
export const QUsers = deepFreeze(new TUsers());

export class TLocations extends QueryTable {
	$table = new TableMetamodel("Locations", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	agencyId = new NumericColumnMetamodel(this.$table, "agencyId", Number);
}
export const QLocations = deepFreeze(new TLocations());

export class TAgencies extends QueryTable {
	$table = new TableMetamodel("Agencies", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
}
export const QAgencies = deepFreeze(new TAgencies());
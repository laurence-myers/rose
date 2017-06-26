import {
	BooleanColumnMetamodel,
	ColumnMetamodel,
	DateColumnMetamodel, NumericColumnMetamodel, QueryTable, StringColumnMetamodel,
	TableMetamodel
} from "../src/query/metamodel";
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
	clientId = new NumericColumnMetamodel(this.$table, "clientId", Number);
	agencyId = new NumericColumnMetamodel(this.$table, "agencyId", Number);
}
export const QLocations = deepFreeze(new TLocations());

export class TAgencies extends QueryTable {
	$table = new TableMetamodel("Agencies", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
}
export const QAgencies = deepFreeze(new TAgencies());

export class TRecurringPayments extends QueryTable {
	$table = new TableMetamodel("RecurringPayments", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	startDate = new DateColumnMetamodel(this.$table, "startDate", Date);
	endDate = new DateColumnMetamodel(this.$table, "endDate", Date);
	nextDate = new DateColumnMetamodel(this.$table, "nextDate", Date);
	locationId = new NumericColumnMetamodel(this.$table, "locationId", Number);
}

export const QRecurringPayments = deepFreeze(new TRecurringPayments);

export class TBuilderTemplates extends QueryTable {
	$table = new TableMetamodel("BuilderTemplates", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	title = new StringColumnMetamodel(this.$table, "title", String);
	createdAt = new DateColumnMetamodel(this.$table, "createdAt", Date);
	clientId = new NumericColumnMetamodel(this.$table, "clientId", Number);
	compositeImageId = new NumericColumnMetamodel(this.$table, "compositeImageId", Number);
}

export const QBuilderTemplates = deepFreeze(new TBuilderTemplates());

export class TBuilderTemplateCategories extends QueryTable {
	$table = new TableMetamodel("BuilderTemplateCategories", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	groupLabel = new StringColumnMetamodel(this.$table, "groupLabel", String);
	label = new StringColumnMetamodel(this.$table, "label", String);
	width = new NumericColumnMetamodel(this.$table, "width", Number);
	height = new NumericColumnMetamodel(this.$table, "height", Number);
	platformId = new NumericColumnMetamodel(this.$table, "platformId", Number);
}

export const QBuilderTemplateCategories = deepFreeze(new TBuilderTemplateCategories());

export class TBuilderTemplateToCategoryMap extends QueryTable {
	$table = new TableMetamodel("BuilderTemplateToCategoryMap", this.$tableAlias);

	createdAt = new DateColumnMetamodel(this.$table, "createdAt", Date);
	updatedAt = new DateColumnMetamodel(this.$table, "updatedAt", Date);
	builderTemplateId = new NumericColumnMetamodel(this.$table, "builderTemplateId", Number);
	builderTemplateCategoryId = new NumericColumnMetamodel(this.$table, "builderTemplateCategoryId", Number);
}

export const QBuilderTemplateToCategoryMap = deepFreeze(new TBuilderTemplateToCategoryMap());

export class TTags extends QueryTable {
	$table = new TableMetamodel("Tags", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
	title = new StringColumnMetamodel(this.$table, "title", String);
}

export const QTags = deepFreeze(new TTags());

export class TUploads extends QueryTable {
	$table = new TableMetamodel("Uploads", this.$tableAlias);

	id = new NumericColumnMetamodel(this.$table, "id", Number);
}

export const QUploads = deepFreeze(new TUploads());

export class TBuilderTemplateTags extends QueryTable {
	$table = new TableMetamodel("BuilderTemplateTags", this.$tableAlias);

	builderTemplateId = new NumericColumnMetamodel(this.$table, "builderTemplateId", Number);
	tagId = new NumericColumnMetamodel(this.$table, "tagId", Number);
}

export const QBuilderTemplateTags = deepFreeze(new TBuilderTemplateTags());

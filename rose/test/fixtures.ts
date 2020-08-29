import {
	ColumnMetamodel,
	QueryTable,
	TableMetamodel
} from "../src/query/metamodel";
import { deepFreeze } from "../src/lang";

export class TUsers extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Users", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	locationId = new ColumnMetamodel<number>(this.$table, "locationId");
	name = new ColumnMetamodel<string>(this.$table, "name");
	deletedAt = new ColumnMetamodel<Date | null>(this.$table, "deletedAt");
}
export const QUsers = deepFreeze(new TUsers());

export class TUsersSC extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Users", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	locationId = new ColumnMetamodel<number>(this.$table, "location_id");
	name = new ColumnMetamodel<string>(this.$table, "name");
	deletedAt = new ColumnMetamodel<Date | null>(this.$table, "deleted_at");
}
export const QUsersSC = deepFreeze(new TUsersSC());

export interface UsersInsertRow {
	id?: number;
	locationId: number;
	name: string;
	deletedAt?: Date | null;
}

export class TLocations extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Locations", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	name = new ColumnMetamodel<number>(this.$table, "name");
	clientId = new ColumnMetamodel<number>(this.$table, "clientId");
	agencyId = new ColumnMetamodel<number>(this.$table, "agencyId");
}
export const QLocations = deepFreeze(new TLocations());

export class TAgencies extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Agencies", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
}
export const QAgencies = deepFreeze(new TAgencies());

export class TRecurringPayments extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("RecurringPayments", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	startDate = new ColumnMetamodel<Date>(this.$table, "startDate");
	endDate = new ColumnMetamodel<Date>(this.$table, "endDate");
	nextDate = new ColumnMetamodel<Date>(this.$table, "nextDate");
	locationId = new ColumnMetamodel<number>(this.$table, "locationId");
	amount = new ColumnMetamodel<string>(this.$table, "amount");
}

export const QRecurringPayments = deepFreeze(new TRecurringPayments);

export class TBuilderTemplates extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("BuilderTemplates", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	title = new ColumnMetamodel<string>(this.$table, "title");
	createdAt = new ColumnMetamodel<Date>(this.$table, "createdAt");
	clientId = new ColumnMetamodel<number>(this.$table, "clientId");
	compositeImageId = new ColumnMetamodel<number>(this.$table, "compositeImageId");
}

export const QBuilderTemplates = deepFreeze(new TBuilderTemplates());

export class TBuilderTemplateCategories extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("BuilderTemplateCategories", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	groupLabel = new ColumnMetamodel<string>(this.$table, "groupLabel");
	label = new ColumnMetamodel<string>(this.$table, "label");
	width = new ColumnMetamodel<number>(this.$table, "width");
	height = new ColumnMetamodel<number>(this.$table, "height");
	platformId = new ColumnMetamodel<number>(this.$table, "platformId");
}

export const QBuilderTemplateCategories = deepFreeze(new TBuilderTemplateCategories());

export class TBuilderTemplateToCategoryMap extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("BuilderTemplateToCategoryMap", $tableAlias)); }

	createdAt = new ColumnMetamodel<Date>(this.$table, "createdAt");
	updatedAt = new ColumnMetamodel<Date>(this.$table, "updatedAt");
	builderTemplateId = new ColumnMetamodel<number>(this.$table, "builderTemplateId");
	builderTemplateCategoryId = new ColumnMetamodel<number>(this.$table, "builderTemplateCategoryId");
}

export const QBuilderTemplateToCategoryMap = deepFreeze(new TBuilderTemplateToCategoryMap());

export class TTags extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Tags", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
	title = new ColumnMetamodel<string>(this.$table, "title");
}

export const QTags = deepFreeze(new TTags());

export class TUploads extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Uploads", $tableAlias)); }

	id = new ColumnMetamodel<number>(this.$table, "id");
}

export const QUploads = deepFreeze(new TUploads());

export class TBuilderTemplateTags extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("BuilderTemplateTags", $tableAlias)); }

	builderTemplateId = new ColumnMetamodel<number>(this.$table, "builderTemplateId");
	tagId = new ColumnMetamodel<number>(this.$table, "tagId");
}

export const QBuilderTemplateTags = deepFreeze(new TBuilderTemplateTags());

export class TOrders extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("orders", $tableAlias)); }

	region = new ColumnMetamodel<string>(this.$table, "region");
	product = new ColumnMetamodel<string>(this.$table, "product");
	quantity = new ColumnMetamodel<number>(this.$table, "quantity");
	amount = new ColumnMetamodel<number>(this.$table, "amount");
}
export const QOrders = new TOrders();

export class TParent extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Parent", $tableAlias)); }

	parentId = new ColumnMetamodel<number>(this.$table, "parentId");
	name = new ColumnMetamodel<string>(this.$table, "name");
}

export const QParent = deepFreeze(new TParent());

class TChild extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("Child", $tableAlias)); }

	childId = new ColumnMetamodel<number>(this.$table, "childId");
	parentId = new ColumnMetamodel<number>(this.$table, "parentId");
	name = new ColumnMetamodel<string>(this.$table, "name");
}

export const QChild = deepFreeze(new TChild());

class TOtherChild extends QueryTable {
	constructor($tableAlias? : string) { super(new TableMetamodel("OtherChild", $tableAlias)); }

	otherChildId = new ColumnMetamodel<number>(this.$table, "otherChildId");
	parentId = new ColumnMetamodel<number>(this.$table, "parentId");
	name = new ColumnMetamodel<string>(this.$table, "name");
}

export const QOtherChild = deepFreeze(new TOtherChild());

export interface ProjectRoleRow {
	activeAt: Date;
	inactiveAt: Date | null;
	memberId: string;
	projectId: string;
	role: 'CommunityManager' | 'ProjectCreator' | 'ProjectManager' | 'Supporter';
}

export class TProjectRole extends QueryTable {
	activeAt = new ColumnMetamodel<Date>(this.$table, 'active_at');
	inactiveAt = new ColumnMetamodel<Date | null>(this.$table, 'inactive_at');
	memberId = new ColumnMetamodel<string>(this.$table, 'member_id');
	projectId = new ColumnMetamodel<string>(this.$table, 'project_id');
	role = new ColumnMetamodel<'CommunityManager' | 'ProjectCreator' | 'ProjectManager' | 'Supporter'>(this.$table, 'role');

	constructor ($tableAlias?: string) {
		super(new TableMetamodel('project_role', $tableAlias));
	}

}

export const QProjectRole = deepFreeze(new TProjectRole());

export interface ProjectRow {
	createdAt: Date;
	deletedAt: Date | null;
	description: string;
	isClaimed: boolean;
	name: string;
	pledgeCurrency: string;
	pledgeTotal: string;
	projectId: string;
	shortCode: string;
	status: 'Active' | 'Completed' | 'Cancelled';
	updatedAt: Date;
}

export class TProject extends QueryTable {
	createdAt = new ColumnMetamodel<Date>(this.$table, 'created_at');
	deletedAt = new ColumnMetamodel<Date | null>(this.$table, 'deleted_at');
	description = new ColumnMetamodel<string>(this.$table, 'description');
	isClaimed = new ColumnMetamodel<boolean>(this.$table, 'is_claimed');
	name = new ColumnMetamodel<string>(this.$table, 'name');
	pledgeCurrency = new ColumnMetamodel<string>(this.$table, 'pledge_currency');
	pledgeTotal = new ColumnMetamodel<string>(this.$table, 'pledge_total');
	projectId = new ColumnMetamodel<string>(this.$table, 'project_id');
	shortCode = new ColumnMetamodel<string>(this.$table, 'short_code');
	status = new ColumnMetamodel<'Active' | 'Completed' | 'Cancelled'>(this.$table, 'status');
	updatedAt = new ColumnMetamodel<Date>(this.$table, 'updated_at');

	constructor ($tableAlias?: string) {
		super(new TableMetamodel('project', $tableAlias));
	}

}

export const QProject = deepFreeze(new TProject());

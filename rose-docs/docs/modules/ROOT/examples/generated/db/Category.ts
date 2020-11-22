// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface CategoryRow {
	categoryId: number;
	lastUpdate: Date;
	name: string;
}

export interface CategoryInsertRow {
	categoryId?: number;
	lastUpdate?: Date;
	name: string;
}

export class TCategory extends rose.QueryTable {
	categoryId = new rose.ColumnMetamodel<number>(this.$table, 'category_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	name = new rose.ColumnMetamodel<string>(this.$table, 'name');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('category', $tableAlias));
	}

}

export const QCategory = rose.deepFreeze(new TCategory());
export const CategoryAllColumns = {
	categoryId: QCategory.categoryId,
	lastUpdate: QCategory.lastUpdate,
	name: QCategory.name,
};
export const CategoryDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			categoryId: number;
		}

		const P = rose.params<Params>();
		return rose.select(CategoryAllColumns).where(QCategory.categoryId.eq(P.categoryId)).finalise(P);
	})(),
	insertOne: function insertOne(row: CategoryInsertRow) {
		return rose.insertFromObject<TCategory, CategoryInsertRow>(QCategory, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCategory>) {
		interface Params {
			categoryId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QCategory, updates).where(QCategory.categoryId.eq(P.categoryId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			categoryId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QCategory).where(QCategory.categoryId.eq(P.categoryId)).finalise(P);
	})(),
};

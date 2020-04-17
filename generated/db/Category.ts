// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

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

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof CategoryAllColumns, Params>(CategoryAllColumns).where(QCategory.categoryId.eq(P.get((p) => p.categoryId))).prepare();
	})(),
	insertOne: function updateOne(row: CategoryInsertRow) {
		return rose.insertFromObject<TCategory, CategoryInsertRow, {}>(QCategory, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCategory>) {
		interface Params {
			categoryId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TCategory, Params>(QCategory, updates).where(QCategory.categoryId.eq(P.get((p) => p.categoryId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			categoryId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QCategory).where(QCategory.categoryId.eq(P.get((p) => p.categoryId))).prepare();
	})(),
};

// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface SalesByFilmCategoryRow {
	category: string | null;
	totalSales: number | null;
}

export interface SalesByFilmCategoryInsertRow {
	category?: string | null;
	totalSales?: number | null;
}

export class TSalesByFilmCategory extends rose.QueryTable {
	category = new rose.ColumnMetamodel<string | null>(this.$table, 'category');
	totalSales = new rose.ColumnMetamodel<number | null>(this.$table, 'total_sales');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('sales_by_film_category', $tableAlias));
	}

}

export const QSalesByFilmCategory = rose.deepFreeze(new TSalesByFilmCategory());
export const SalesByFilmCategoryAllColumns = {
	category: QSalesByFilmCategory.category,
	totalSales: QSalesByFilmCategory.totalSales,
};
export const SalesByFilmCategoryDefaultQueries = {
	insertOne: function insertOne(row: SalesByFilmCategoryInsertRow) {
		return rose.insertFromObject<TSalesByFilmCategory, SalesByFilmCategoryInsertRow>(QSalesByFilmCategory, row).finalise({});
	},
};

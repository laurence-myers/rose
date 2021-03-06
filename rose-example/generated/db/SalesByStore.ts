// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface SalesByStoreRow {
	manager: string | null;
	store: string | null;
	totalSales: string | null;
}

export interface SalesByStoreInsertRow {
	manager?: string | null;
	store?: string | null;
	totalSales?: string | null;
}

export class TSalesByStore extends rose.QueryTable {
	manager = new rose.ColumnMetamodel<string | null>(this.$table, 'manager');
	store = new rose.ColumnMetamodel<string | null>(this.$table, 'store');
	totalSales = new rose.ColumnMetamodel<string | null>(this.$table, 'total_sales');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('sales_by_store', $tableAlias));
	}

}

export const QSalesByStore = rose.deepFreeze(new TSalesByStore());
export const SalesByStoreAllColumns = {
	manager: QSalesByStore.manager,
	store: QSalesByStore.store,
	totalSales: QSalesByStore.totalSales,
};
export const SalesByStoreDefaultQueries = {
	insertOne: function insertOne(row: SalesByStoreInsertRow) {
		return rose.insertFromObject<TSalesByStore, SalesByStoreInsertRow>(QSalesByStore, row).finalise({});
	},
};

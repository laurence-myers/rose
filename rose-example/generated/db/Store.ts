// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface StoreRow {
	addressId: number;
	lastUpdate: Date;
	managerStaffId: number;
	name: string;
	storeId: number;
}

export interface StoreInsertRow {
	addressId: number;
	lastUpdate?: Date;
	managerStaffId: number;
	name: string;
	storeId?: number;
}

export class TStore extends rose.QueryTable {
	addressId = new rose.ColumnMetamodel<number>(this.$table, 'address_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	managerStaffId = new rose.ColumnMetamodel<number>(this.$table, 'manager_staff_id');
	name = new rose.ColumnMetamodel<string>(this.$table, 'name');
	storeId = new rose.ColumnMetamodel<number>(this.$table, 'store_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('store', $tableAlias));
	}

}

export const QStore = rose.deepFreeze(new TStore());
export const StoreAllColumns = {
	addressId: QStore.addressId,
	lastUpdate: QStore.lastUpdate,
	managerStaffId: QStore.managerStaffId,
	name: QStore.name,
	storeId: QStore.storeId,
};
export const StoreDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			storeId: number;
		}

		const P = rose.params<Params>();
		return rose.select(StoreAllColumns).where(QStore.storeId.eq(P.storeId)).finalise(P);
	})(),
	insertOne: function insertOne(row: StoreInsertRow) {
		return rose.insertFromObject<TStore, StoreInsertRow>(QStore, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TStore>) {
		interface Params {
			storeId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QStore, updates).where(QStore.storeId.eq(P.storeId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			storeId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QStore).where(QStore.storeId.eq(P.storeId)).finalise(P);
	})(),
};

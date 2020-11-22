// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface InventoryRow {
	filmId: number;
	inventoryId: number;
	lastUpdate: Date;
	storeId: number;
}

export interface InventoryInsertRow {
	filmId: number;
	inventoryId?: number;
	lastUpdate?: Date;
	storeId: number;
}

export class TInventory extends rose.QueryTable {
	filmId = new rose.ColumnMetamodel<number>(this.$table, 'film_id');
	inventoryId = new rose.ColumnMetamodel<number>(this.$table, 'inventory_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	storeId = new rose.ColumnMetamodel<number>(this.$table, 'store_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('inventory', $tableAlias));
	}

}

export const QInventory = rose.deepFreeze(new TInventory());
export const InventoryAllColumns = {
	filmId: QInventory.filmId,
	inventoryId: QInventory.inventoryId,
	lastUpdate: QInventory.lastUpdate,
	storeId: QInventory.storeId,
};
export const InventoryDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			inventoryId: number;
		}

		const P = rose.params<Params>();
		return rose.select(InventoryAllColumns).where(QInventory.inventoryId.eq(P.inventoryId)).finalise(P);
	})(),
	insertOne: function insertOne(row: InventoryInsertRow) {
		return rose.insertFromObject<TInventory, InventoryInsertRow>(QInventory, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TInventory>) {
		interface Params {
			inventoryId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QInventory, updates).where(QInventory.inventoryId.eq(P.inventoryId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			inventoryId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QInventory).where(QInventory.inventoryId.eq(P.inventoryId)).finalise(P);
	})(),
};

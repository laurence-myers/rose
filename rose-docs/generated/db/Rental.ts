// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface RentalRow {
	customerId: number;
	inventoryId: number;
	lastUpdate: Date;
	rentalDate: Date;
	rentalId: number;
	returnDate: Date | null;
	staffId: number;
}

export interface RentalInsertRow {
	customerId: number;
	inventoryId: number;
	lastUpdate?: Date;
	rentalDate: Date;
	rentalId?: number;
	returnDate?: Date | null;
	staffId: number;
}

export class TRental extends rose.QueryTable {
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	inventoryId = new rose.ColumnMetamodel<number>(this.$table, 'inventory_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	rentalDate = new rose.ColumnMetamodel<Date>(this.$table, 'rental_date');
	rentalId = new rose.ColumnMetamodel<number>(this.$table, 'rental_id');
	returnDate = new rose.ColumnMetamodel<Date | null>(this.$table, 'return_date');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('rental', $tableAlias));
	}

}

export const QRental = rose.deepFreeze(new TRental());
export const RentalAllColumns = {
	customerId: QRental.customerId,
	inventoryId: QRental.inventoryId,
	lastUpdate: QRental.lastUpdate,
	rentalDate: QRental.rentalDate,
	rentalId: QRental.rentalId,
	returnDate: QRental.returnDate,
	staffId: QRental.staffId,
};
export const RentalDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			rentalId: number;
		}

		const P = rose.params<Params>();
		return rose.select(RentalAllColumns).where(QRental.rentalId.eq(P.rentalId)).finalise(P);
	})(),
	insertOne: function insertOne(row: RentalInsertRow) {
		return rose.insertFromObject<TRental, RentalInsertRow>(QRental, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TRental>) {
		interface Params {
			rentalId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QRental, updates).where(QRental.rentalId.eq(P.rentalId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			rentalId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QRental).where(QRental.rentalId.eq(P.rentalId)).finalise(P);
	})(),
};

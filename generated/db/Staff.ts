// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface StaffRow {
	active: boolean;
	addressId: number;
	email: string | null;
	firstName: string;
	lastName: string;
	lastUpdate: Date;
	password: string | null;
	picture: Buffer | null;
	staffId: number;
	storeId: number;
	username: string;
}

export interface StaffInsertRow {
	active?: boolean;
	addressId: number;
	email?: string | null;
	firstName: string;
	lastName: string;
	lastUpdate?: Date;
	password?: string | null;
	picture?: Buffer | null;
	staffId?: number;
	storeId: number;
	username: string;
}

export class TStaff extends rose.QueryTable {
	active = new rose.ColumnMetamodel<boolean>(this.$table, 'active');
	addressId = new rose.ColumnMetamodel<number>(this.$table, 'address_id');
	email = new rose.ColumnMetamodel<string | null>(this.$table, 'email');
	firstName = new rose.ColumnMetamodel<string>(this.$table, 'first_name');
	lastName = new rose.ColumnMetamodel<string>(this.$table, 'last_name');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	password = new rose.ColumnMetamodel<string | null>(this.$table, 'password');
	picture = new rose.ColumnMetamodel<Buffer | null>(this.$table, 'picture');
	staffId = new rose.ColumnMetamodel<number>(this.$table, 'staff_id');
	storeId = new rose.ColumnMetamodel<number>(this.$table, 'store_id');
	username = new rose.ColumnMetamodel<string>(this.$table, 'username');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('staff', $tableAlias));
	}

}

export const QStaff = rose.deepFreeze(new TStaff());
export const StaffAllColumns = {
	active: QStaff.active,
	addressId: QStaff.addressId,
	email: QStaff.email,
	firstName: QStaff.firstName,
	lastName: QStaff.lastName,
	lastUpdate: QStaff.lastUpdate,
	password: QStaff.password,
	picture: QStaff.picture,
	staffId: QStaff.staffId,
	storeId: QStaff.storeId,
	username: QStaff.username,
};
export const StaffDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			staffId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof StaffAllColumns, Params>(StaffAllColumns).where(QStaff.staffId.eq(P.get((p) => p.staffId))).prepare();
	})(),
	insertOne: function updateOne(row: StaffInsertRow) {
		return rose.insertFromObject<TStaff, StaffInsertRow, {}>(QStaff, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TStaff>) {
		interface Params {
			staffId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TStaff, Params>(QStaff, updates).where(QStaff.staffId.eq(P.get((p) => p.staffId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			staffId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QStaff).where(QStaff.staffId.eq(P.get((p) => p.staffId))).prepare();
	})(),
};

// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface CustomerRow {
	active: number | null;
	activebool: boolean;
	addressId: number;
	createDate: Date;
	customerId: number;
	email: string | null;
	firstName: string;
	lastName: string;
	lastUpdate: Date | null;
	storeId: number;
}

export interface CustomerInsertRow {
	active?: number | null;
	activebool?: boolean;
	addressId: number;
	createDate?: Date;
	customerId?: number;
	email?: string | null;
	firstName: string;
	lastName: string;
	lastUpdate?: Date | null;
	storeId: number;
}

export class TCustomer extends rose.QueryTable {
	active = new rose.ColumnMetamodel<number | null>(this.$table, 'active');
	activebool = new rose.ColumnMetamodel<boolean>(this.$table, 'activebool');
	addressId = new rose.ColumnMetamodel<number>(this.$table, 'address_id');
	createDate = new rose.ColumnMetamodel<Date>(this.$table, 'create_date');
	customerId = new rose.ColumnMetamodel<number>(this.$table, 'customer_id');
	email = new rose.ColumnMetamodel<string | null>(this.$table, 'email');
	firstName = new rose.ColumnMetamodel<string>(this.$table, 'first_name');
	lastName = new rose.ColumnMetamodel<string>(this.$table, 'last_name');
	lastUpdate = new rose.ColumnMetamodel<Date | null>(this.$table, 'last_update');
	storeId = new rose.ColumnMetamodel<number>(this.$table, 'store_id');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('customer', $tableAlias));
	}

}

export const QCustomer = rose.deepFreeze(new TCustomer());
export const CustomerAllColumns = {
	active: QCustomer.active,
	activebool: QCustomer.activebool,
	addressId: QCustomer.addressId,
	createDate: QCustomer.createDate,
	customerId: QCustomer.customerId,
	email: QCustomer.email,
	firstName: QCustomer.firstName,
	lastName: QCustomer.lastName,
	lastUpdate: QCustomer.lastUpdate,
	storeId: QCustomer.storeId,
};
export const CustomerDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			customerId: number;
		}

		const P = rose.params<Params>();
		return rose.select(CustomerAllColumns).where(QCustomer.customerId.eq(P.customerId)).finalise(P);
	})(),
	insertOne: function insertOne(row: CustomerInsertRow) {
		return rose.insertFromObject<TCustomer, CustomerInsertRow>(QCustomer, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCustomer>) {
		interface Params {
			customerId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QCustomer, updates).where(QCustomer.customerId.eq(P.customerId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			customerId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QCustomer).where(QCustomer.customerId.eq(P.customerId)).finalise(P);
	})(),
};

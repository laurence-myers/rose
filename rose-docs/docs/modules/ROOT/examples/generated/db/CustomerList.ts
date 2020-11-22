// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface CustomerListRow {
	address: string | null;
	city: string | null;
	country: string | null;
	id: number | null;
	name: string | null;
	notes: string | null;
	phone: string | null;
	sid: number | null;
	zipCode: string | null;
}

export interface CustomerListInsertRow {
	address?: string | null;
	city?: string | null;
	country?: string | null;
	id?: number | null;
	name?: string | null;
	notes?: string | null;
	phone?: string | null;
	sid?: number | null;
	zipCode?: string | null;
}

export class TCustomerList extends rose.QueryTable {
	address = new rose.ColumnMetamodel<string | null>(this.$table, 'address');
	city = new rose.ColumnMetamodel<string | null>(this.$table, 'city');
	country = new rose.ColumnMetamodel<string | null>(this.$table, 'country');
	id = new rose.ColumnMetamodel<number | null>(this.$table, 'id');
	name = new rose.ColumnMetamodel<string | null>(this.$table, 'name');
	notes = new rose.ColumnMetamodel<string | null>(this.$table, 'notes');
	phone = new rose.ColumnMetamodel<string | null>(this.$table, 'phone');
	sid = new rose.ColumnMetamodel<number | null>(this.$table, 'sid');
	zipCode = new rose.ColumnMetamodel<string | null>(this.$table, 'zip code');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('customer_list', $tableAlias));
	}

}

export const QCustomerList = rose.deepFreeze(new TCustomerList());
export const CustomerListAllColumns = {
	address: QCustomerList.address,
	city: QCustomerList.city,
	country: QCustomerList.country,
	id: QCustomerList.id,
	name: QCustomerList.name,
	notes: QCustomerList.notes,
	phone: QCustomerList.phone,
	sid: QCustomerList.sid,
	zipCode: QCustomerList.zipCode,
};
export const CustomerListDefaultQueries = {
	insertOne: function insertOne(row: CustomerListInsertRow) {
		return rose.insertFromObject<TCustomerList, CustomerListInsertRow>(QCustomerList, row).finalise({});
	},
};

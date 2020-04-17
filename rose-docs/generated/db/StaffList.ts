// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface StaffListRow {
	address: string | null;
	city: string | null;
	country: string | null;
	id: number | null;
	name: string | null;
	phone: string | null;
	sid: number | null;
	zipCode: string | null;
}

export interface StaffListInsertRow {
	address?: string | null;
	city?: string | null;
	country?: string | null;
	id?: number | null;
	name?: string | null;
	phone?: string | null;
	sid?: number | null;
	zipCode?: string | null;
}

export class TStaffList extends rose.QueryTable {
	address = new rose.ColumnMetamodel<string | null>(this.$table, 'address');
	city = new rose.ColumnMetamodel<string | null>(this.$table, 'city');
	country = new rose.ColumnMetamodel<string | null>(this.$table, 'country');
	id = new rose.ColumnMetamodel<number | null>(this.$table, 'id');
	name = new rose.ColumnMetamodel<string | null>(this.$table, 'name');
	phone = new rose.ColumnMetamodel<string | null>(this.$table, 'phone');
	sid = new rose.ColumnMetamodel<number | null>(this.$table, 'sid');
	zipCode = new rose.ColumnMetamodel<string | null>(this.$table, 'zip code');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('staff_list', $tableAlias));
	}

}

export const QStaffList = rose.deepFreeze(new TStaffList());
export const StaffListAllColumns = {
	address: QStaffList.address,
	city: QStaffList.city,
	country: QStaffList.country,
	id: QStaffList.id,
	name: QStaffList.name,
	phone: QStaffList.phone,
	sid: QStaffList.sid,
	zipCode: QStaffList.zipCode,
};
export const StaffListDefaultQueries = {
	insertOne: function updateOne(row: StaffListInsertRow) {
		return rose.insertFromObject<TStaffList, StaffListInsertRow, {}>(QStaffList, row).prepare();
	},
};

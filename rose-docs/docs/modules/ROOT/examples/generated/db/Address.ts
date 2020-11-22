// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface AddressRow {
	address: string;
	address2: string | null;
	addressId: number;
	cityId: number;
	district: string;
	lastUpdate: Date;
	phone: string;
	postalCode: string | null;
}

export interface AddressInsertRow {
	address: string;
	address2?: string | null;
	addressId?: number;
	cityId: number;
	district: string;
	lastUpdate?: Date;
	phone: string;
	postalCode?: string | null;
}

export class TAddress extends rose.QueryTable {
	address = new rose.ColumnMetamodel<string>(this.$table, 'address');
	address2 = new rose.ColumnMetamodel<string | null>(this.$table, 'address2');
	addressId = new rose.ColumnMetamodel<number>(this.$table, 'address_id');
	cityId = new rose.ColumnMetamodel<number>(this.$table, 'city_id');
	district = new rose.ColumnMetamodel<string>(this.$table, 'district');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	phone = new rose.ColumnMetamodel<string>(this.$table, 'phone');
	postalCode = new rose.ColumnMetamodel<string | null>(this.$table, 'postal_code');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('address', $tableAlias));
	}

}

export const QAddress = rose.deepFreeze(new TAddress());
export const AddressAllColumns = {
	address: QAddress.address,
	address2: QAddress.address2,
	addressId: QAddress.addressId,
	cityId: QAddress.cityId,
	district: QAddress.district,
	lastUpdate: QAddress.lastUpdate,
	phone: QAddress.phone,
	postalCode: QAddress.postalCode,
};
export const AddressDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			addressId: number;
		}

		const P = rose.params<Params>();
		return rose.select(AddressAllColumns).where(QAddress.addressId.eq(P.addressId)).finalise(P);
	})(),
	insertOne: function insertOne(row: AddressInsertRow) {
		return rose.insertFromObject<TAddress, AddressInsertRow>(QAddress, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TAddress>) {
		interface Params {
			addressId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QAddress, updates).where(QAddress.addressId.eq(P.addressId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			addressId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QAddress).where(QAddress.addressId.eq(P.addressId)).finalise(P);
	})(),
};

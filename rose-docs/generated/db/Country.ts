// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface CountryRow {
	country: string;
	countryId: number;
	lastUpdate: Date;
}

export interface CountryInsertRow {
	country: string;
	countryId?: number;
	lastUpdate?: Date;
}

export class TCountry extends rose.QueryTable {
	country = new rose.ColumnMetamodel<string>(this.$table, 'country');
	countryId = new rose.ColumnMetamodel<number>(this.$table, 'country_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('country', $tableAlias));
	}

}

export const QCountry = rose.deepFreeze(new TCountry());
export const CountryAllColumns = {
	country: QCountry.country,
	countryId: QCountry.countryId,
	lastUpdate: QCountry.lastUpdate,
};
export const CountryDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			countryId: number;
		}

		const P = rose.params<Params>();
		return rose.select(CountryAllColumns).where(QCountry.countryId.eq(P.countryId)).finalise(P);
	})(),
	insertOne: function insertOne(row: CountryInsertRow) {
		return rose.insertFromObject<TCountry, CountryInsertRow>(QCountry, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCountry>) {
		interface Params {
			countryId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QCountry, updates).where(QCountry.countryId.eq(P.countryId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			countryId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QCountry).where(QCountry.countryId.eq(P.countryId)).finalise(P);
	})(),
};

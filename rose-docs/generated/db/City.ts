// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface CityRow {
	city: string;
	cityId: number;
	countryId: number;
	lastUpdate: Date;
}

export interface CityInsertRow {
	city: string;
	cityId?: number;
	countryId: number;
	lastUpdate?: Date;
}

export class TCity extends rose.QueryTable {
	city = new rose.ColumnMetamodel<string>(this.$table, 'city');
	cityId = new rose.ColumnMetamodel<number>(this.$table, 'city_id');
	countryId = new rose.ColumnMetamodel<number>(this.$table, 'country_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('city', $tableAlias));
	}

}

export const QCity = rose.deepFreeze(new TCity());
export const CityAllColumns = {
	city: QCity.city,
	cityId: QCity.cityId,
	countryId: QCity.countryId,
	lastUpdate: QCity.lastUpdate,
};
export const CityDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			cityId: number;
		}

		const P = rose.params<Params>();
		return rose.select(CityAllColumns).where(QCity.cityId.eq(P.cityId)).finalise(P);
	})(),
	insertOne: function insertOne(row: CityInsertRow) {
		return rose.insertFromObject<TCity, CityInsertRow>(QCity, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCity>) {
		interface Params {
			cityId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QCity, updates).where(QCity.cityId.eq(P.cityId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			cityId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QCity).where(QCity.cityId.eq(P.cityId)).finalise(P);
	})(),
};

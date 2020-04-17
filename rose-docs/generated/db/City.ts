// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

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

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof CityAllColumns, Params>(CityAllColumns).where(QCity.cityId.eq(P.get((p) => p.cityId))).prepare();
	})(),
	insertOne: function updateOne(row: CityInsertRow) {
		return rose.insertFromObject<TCity, CityInsertRow, {}>(QCity, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TCity>) {
		interface Params {
			cityId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TCity, Params>(QCity, updates).where(QCity.cityId.eq(P.get((p) => p.cityId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			cityId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QCity).where(QCity.cityId.eq(P.get((p) => p.cityId))).prepare();
	})(),
};

// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface NicerButSlowerFilmListRow {
	actors: string | null;
	category: string | null;
	description: string | null;
	fid: number | null;
	length: number | null;
	price: string | null;
	rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null;
	title: string | null;
}

export interface NicerButSlowerFilmListInsertRow {
	actors?: string | null;
	category?: string | null;
	description?: string | null;
	fid?: number | null;
	length?: number | null;
	price?: string | null;
	rating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null;
	title?: string | null;
}

export class TNicerButSlowerFilmList extends rose.QueryTable {
	actors = new rose.ColumnMetamodel<string | null>(this.$table, 'actors');
	category = new rose.ColumnMetamodel<string | null>(this.$table, 'category');
	description = new rose.ColumnMetamodel<string | null>(this.$table, 'description');
	fid = new rose.ColumnMetamodel<number | null>(this.$table, 'fid');
	length = new rose.ColumnMetamodel<number | null>(this.$table, 'length');
	price = new rose.ColumnMetamodel<string | null>(this.$table, 'price');
	rating = new rose.ColumnMetamodel<'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null>(this.$table, 'rating');
	title = new rose.ColumnMetamodel<string | null>(this.$table, 'title');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('nicer_but_slower_film_list', $tableAlias));
	}

}

export const QNicerButSlowerFilmList = rose.deepFreeze(new TNicerButSlowerFilmList());
export const NicerButSlowerFilmListAllColumns = {
	actors: QNicerButSlowerFilmList.actors,
	category: QNicerButSlowerFilmList.category,
	description: QNicerButSlowerFilmList.description,
	fid: QNicerButSlowerFilmList.fid,
	length: QNicerButSlowerFilmList.length,
	price: QNicerButSlowerFilmList.price,
	rating: QNicerButSlowerFilmList.rating,
	title: QNicerButSlowerFilmList.title,
};
export const NicerButSlowerFilmListDefaultQueries = {
	insertOne: function insertOne(row: NicerButSlowerFilmListInsertRow) {
		return rose.insertFromObject<TNicerButSlowerFilmList, NicerButSlowerFilmListInsertRow>(QNicerButSlowerFilmList, row).finalise({});
	},
};

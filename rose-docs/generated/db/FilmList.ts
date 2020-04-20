// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface FilmListRow {
	actors: string | null;
	category: string | null;
	description: string | null;
	fid: number | null;
	length: number | null;
	price: number | null;
	rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null;
	title: string | null;
}

export interface FilmListInsertRow {
	actors?: string | null;
	category?: string | null;
	description?: string | null;
	fid?: number | null;
	length?: number | null;
	price?: number | null;
	rating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null;
	title?: string | null;
}

export class TFilmList extends rose.QueryTable {
	actors = new rose.ColumnMetamodel<string | null>(this.$table, 'actors');
	category = new rose.ColumnMetamodel<string | null>(this.$table, 'category');
	description = new rose.ColumnMetamodel<string | null>(this.$table, 'description');
	fid = new rose.ColumnMetamodel<number | null>(this.$table, 'fid');
	length = new rose.ColumnMetamodel<number | null>(this.$table, 'length');
	price = new rose.ColumnMetamodel<number | null>(this.$table, 'price');
	rating = new rose.ColumnMetamodel<'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | null>(this.$table, 'rating');
	title = new rose.ColumnMetamodel<string | null>(this.$table, 'title');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('film_list', $tableAlias));
	}

}

export const QFilmList = rose.deepFreeze(new TFilmList());
export const FilmListAllColumns = {
	actors: QFilmList.actors,
	category: QFilmList.category,
	description: QFilmList.description,
	fid: QFilmList.fid,
	length: QFilmList.length,
	price: QFilmList.price,
	rating: QFilmList.rating,
	title: QFilmList.title,
};
export const FilmListDefaultQueries = {
	insertOne: function insertOne(row: FilmListInsertRow) {
		return rose.insertFromObject<TFilmList, FilmListInsertRow>(QFilmList, row).finalise({});
	},
};

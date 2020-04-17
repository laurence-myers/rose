// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface FilmCategoryRow {
	categoryId: number;
	filmId: number;
	lastUpdate: Date;
}

export interface FilmCategoryInsertRow {
	categoryId: number;
	filmId: number;
	lastUpdate?: Date;
}

export class TFilmCategory extends rose.QueryTable {
	categoryId = new rose.ColumnMetamodel<number>(this.$table, 'category_id');
	filmId = new rose.ColumnMetamodel<number>(this.$table, 'film_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('film_category', $tableAlias));
	}

}

export const QFilmCategory = rose.deepFreeze(new TFilmCategory());
export const FilmCategoryAllColumns = {
	categoryId: QFilmCategory.categoryId,
	filmId: QFilmCategory.filmId,
	lastUpdate: QFilmCategory.lastUpdate,
};
export const FilmCategoryDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			filmId: number;
			categoryId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof FilmCategoryAllColumns, Params>(FilmCategoryAllColumns).where(rose.and(QFilmCategory.filmId.eq(P.get((p) => p.filmId)), QFilmCategory.categoryId.eq(P.get((p) => p.categoryId)))).prepare();
	})(),
	insertOne: function updateOne(row: FilmCategoryInsertRow) {
		return rose.insertFromObject<TFilmCategory, FilmCategoryInsertRow, {}>(QFilmCategory, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TFilmCategory>) {
		interface Params {
			filmId: number;
			categoryId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TFilmCategory, Params>(QFilmCategory, updates).where(rose.and(QFilmCategory.filmId.eq(P.get((p) => p.filmId)), QFilmCategory.categoryId.eq(P.get((p) => p.categoryId)))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			filmId: number;
			categoryId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QFilmCategory).where(rose.and(QFilmCategory.filmId.eq(P.get((p) => p.filmId)), QFilmCategory.categoryId.eq(P.get((p) => p.categoryId)))).prepare();
	})(),
};

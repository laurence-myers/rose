// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface FilmRow {
	description: string | null;
	filmId: number;
	fulltext: string;
	languageId: number;
	lastUpdate: Date;
	length: number | null;
	originalLanguageId: number | null;
	rating: any | null;
	releaseYear: number | null;
	rentalDuration: number;
	rentalRate: number;
	replacementCost: number;
	specialFeatures: string[] | null;
	title: string;
}

export interface FilmInsertRow {
	description?: string | null;
	filmId?: number;
	fulltext: string;
	languageId: number;
	lastUpdate?: Date;
	length?: number | null;
	originalLanguageId?: number | null;
	rating?: any | null;
	releaseYear?: number | null;
	rentalDuration?: number;
	rentalRate?: number;
	replacementCost?: number;
	specialFeatures?: string[] | null;
	title: string;
}

export class TFilm extends rose.QueryTable {
	description = new rose.ColumnMetamodel<string | null>(this.$table, 'description');
	filmId = new rose.ColumnMetamodel<number>(this.$table, 'film_id');
	fulltext = new rose.ColumnMetamodel<string>(this.$table, 'fulltext');
	languageId = new rose.ColumnMetamodel<number>(this.$table, 'language_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	length = new rose.ColumnMetamodel<number | null>(this.$table, 'length');
	originalLanguageId = new rose.ColumnMetamodel<number | null>(this.$table, 'original_language_id');
	rating = new rose.ColumnMetamodel<any | null>(this.$table, 'rating');
	releaseYear = new rose.ColumnMetamodel<number | null>(this.$table, 'release_year');
	rentalDuration = new rose.ColumnMetamodel<number>(this.$table, 'rental_duration');
	rentalRate = new rose.ColumnMetamodel<number>(this.$table, 'rental_rate');
	replacementCost = new rose.ColumnMetamodel<number>(this.$table, 'replacement_cost');
	specialFeatures = new rose.ColumnMetamodel<string[] | null>(this.$table, 'special_features');
	title = new rose.ColumnMetamodel<string>(this.$table, 'title');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('film', $tableAlias));
	}

}

export const QFilm = rose.deepFreeze(new TFilm());
export const FilmAllColumns = {
	description: QFilm.description,
	filmId: QFilm.filmId,
	fulltext: QFilm.fulltext,
	languageId: QFilm.languageId,
	lastUpdate: QFilm.lastUpdate,
	length: QFilm.length,
	originalLanguageId: QFilm.originalLanguageId,
	rating: QFilm.rating,
	releaseYear: QFilm.releaseYear,
	rentalDuration: QFilm.rentalDuration,
	rentalRate: QFilm.rentalRate,
	replacementCost: QFilm.replacementCost,
	specialFeatures: QFilm.specialFeatures,
	title: QFilm.title,
};
export const FilmDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			filmId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof FilmAllColumns, Params>(FilmAllColumns).where(QFilm.filmId.eq(P.get((p) => p.filmId))).prepare();
	})(),
	insertOne: function updateOne(row: FilmInsertRow) {
		return rose.insertFromObject<TFilm, FilmInsertRow, {}>(QFilm, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TFilm>) {
		interface Params {
			filmId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TFilm, Params>(QFilm, updates).where(QFilm.filmId.eq(P.get((p) => p.filmId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			filmId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QFilm).where(QFilm.filmId.eq(P.get((p) => p.filmId))).prepare();
	})(),
};

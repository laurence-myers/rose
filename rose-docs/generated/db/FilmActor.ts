// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface FilmActorRow {
	actorId: number;
	filmId: number;
	lastUpdate: Date;
}

export interface FilmActorInsertRow {
	actorId: number;
	filmId: number;
	lastUpdate?: Date;
}

export class TFilmActor extends rose.QueryTable {
	actorId = new rose.ColumnMetamodel<number>(this.$table, 'actor_id');
	filmId = new rose.ColumnMetamodel<number>(this.$table, 'film_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('film_actor', $tableAlias));
	}

}

export const QFilmActor = rose.deepFreeze(new TFilmActor());
export const FilmActorAllColumns = {
	actorId: QFilmActor.actorId,
	filmId: QFilmActor.filmId,
	lastUpdate: QFilmActor.lastUpdate,
};
export const FilmActorDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			actorId: number;
			filmId: number;
		}

		const P = rose.params<Params>();
		return rose.select(FilmActorAllColumns).where(rose.and(QFilmActor.actorId.eq(P.actorId), QFilmActor.filmId.eq(P.filmId))).finalise(P);
	})(),
	insertOne: function insertOne(row: FilmActorInsertRow) {
		return rose.insertFromObject<TFilmActor, FilmActorInsertRow>(QFilmActor, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TFilmActor>) {
		interface Params {
			actorId: number;
			filmId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QFilmActor, updates).where(rose.and(QFilmActor.actorId.eq(P.actorId), QFilmActor.filmId.eq(P.filmId))).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			actorId: number;
			filmId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QFilmActor).where(rose.and(QFilmActor.actorId.eq(P.actorId), QFilmActor.filmId.eq(P.filmId))).finalise(P);
	})(),
};

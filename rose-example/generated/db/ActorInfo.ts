// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface ActorInfoRow {
	actorId: number | null;
	filmInfo: string | null;
	firstName: string | null;
	lastName: string | null;
}

export interface ActorInfoInsertRow {
	actorId?: number | null;
	filmInfo?: string | null;
	firstName?: string | null;
	lastName?: string | null;
}

export class TActorInfo extends rose.QueryTable {
	actorId = new rose.ColumnMetamodel<number | null>(this.$table, 'actor_id');
	filmInfo = new rose.ColumnMetamodel<string | null>(this.$table, 'film_info');
	firstName = new rose.ColumnMetamodel<string | null>(this.$table, 'first_name');
	lastName = new rose.ColumnMetamodel<string | null>(this.$table, 'last_name');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('actor_info', $tableAlias));
	}

}

export const QActorInfo = rose.deepFreeze(new TActorInfo());
export const ActorInfoAllColumns = {
	actorId: QActorInfo.actorId,
	filmInfo: QActorInfo.filmInfo,
	firstName: QActorInfo.firstName,
	lastName: QActorInfo.lastName,
};
export const ActorInfoDefaultQueries = {
	insertOne: function insertOne(row: ActorInfoInsertRow) {
		return rose.insertFromObject<TActorInfo, ActorInfoInsertRow>(QActorInfo, row).finalise({});
	},
};

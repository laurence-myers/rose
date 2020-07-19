// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from '@rosepg/rose';

export interface ActorRow {
	actorId: number;
	firstName: string;
	lastName: string;
	lastUpdate: Date;
}

export interface ActorInsertRow {
	actorId?: number;
	firstName: string;
	lastName: string;
	lastUpdate?: Date;
}

export class TActor extends rose.QueryTable {
	actorId = new rose.ColumnMetamodel<number>(this.$table, 'actor_id');
	firstName = new rose.ColumnMetamodel<string>(this.$table, 'first_name');
	lastName = new rose.ColumnMetamodel<string>(this.$table, 'last_name');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('actor', $tableAlias));
	}

}

export const QActor = rose.deepFreeze(new TActor());
export const ActorAllColumns = {
	actorId: QActor.actorId,
	firstName: QActor.firstName,
	lastName: QActor.lastName,
	lastUpdate: QActor.lastUpdate,
};
export const ActorDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			actorId: number;
		}

		const P = rose.params<Params>();
		return rose.select(ActorAllColumns).where(QActor.actorId.eq(P.actorId)).finalise(P);
	})(),
	insertOne: function insertOne(row: ActorInsertRow) {
		return rose.insertFromObject<TActor, ActorInsertRow>(QActor, row).finalise({});
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TActor>) {
		interface Params {
			actorId: number;
		}

		const P = rose.params<Params>();
		return rose.updateFromObject(QActor, updates).where(QActor.actorId.eq(P.actorId)).finalise(P);
	},
	deleteOne: (function deleteOne() {
		interface Params {
			actorId: number;
		}

		const P = rose.params<Params>();
		return rose.deleteFrom(QActor).where(QActor.actorId.eq(P.actorId)).finalise(P);
	})(),
};

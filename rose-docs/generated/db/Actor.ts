// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

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

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof ActorAllColumns, Params>(ActorAllColumns).where(QActor.actorId.eq(P.get((p) => p.actorId))).prepare();
	})(),
	insertOne: function updateOne(row: ActorInsertRow) {
		return rose.insertFromObject<TActor, ActorInsertRow, {}>(QActor, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TActor>) {
		interface Params {
			actorId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TActor, Params>(QActor, updates).where(QActor.actorId.eq(P.get((p) => p.actorId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			actorId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QActor).where(QActor.actorId.eq(P.get((p) => p.actorId))).prepare();
	})(),
};

// Generated file; do not manually edit, as your changes will be overwritten!
/* eslint-disable */
import * as rose from 'rose';

export interface LanguageRow {
	languageId: number;
	lastUpdate: Date;
	name: string;
}

export interface LanguageInsertRow {
	languageId?: number;
	lastUpdate?: Date;
	name: string;
}

export class TLanguage extends rose.QueryTable {
	languageId = new rose.ColumnMetamodel<number>(this.$table, 'language_id');
	lastUpdate = new rose.ColumnMetamodel<Date>(this.$table, 'last_update');
	name = new rose.ColumnMetamodel<string>(this.$table, 'name');

	constructor ($tableAlias?: string) {
		super(new rose.TableMetamodel('language', $tableAlias));
	}

}

export const QLanguage = rose.deepFreeze(new TLanguage());
export const LanguageAllColumns = {
	languageId: QLanguage.languageId,
	lastUpdate: QLanguage.lastUpdate,
	name: QLanguage.name,
};
export const LanguageDefaultQueries = {
	getOne: (function getOne() {
		interface Params {
			languageId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.select<typeof LanguageAllColumns, Params>(LanguageAllColumns).where(QLanguage.languageId.eq(P.get((p) => p.languageId))).prepare();
	})(),
	insertOne: function updateOne(row: LanguageInsertRow) {
		return rose.insertFromObject<TLanguage, LanguageInsertRow, {}>(QLanguage, row).prepare();
	},
	updateOne: function updateOne(updates: rose.PartialTableColumns<TLanguage>) {
		interface Params {
			languageId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.updateFromObject<TLanguage, Params>(QLanguage, updates).where(QLanguage.languageId.eq(P.get((p) => p.languageId))).prepare();
	},
	deleteOne: (function deleteOne() {
		interface Params {
			languageId: number;
		}

		const P = new rose.ParamsWrapper<Params>();
		return rose.deleteFrom<Params>(QLanguage).where(QLanguage.languageId.eq(P.get((p) => p.languageId))).prepare();
	})(),
};

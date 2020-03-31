import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType } from "./common";
import {
	anno,
	body,
	classConstr,
	classConstrParam,
	classDecl,
	classProp,
	comment,
	funcCall,
	id,
	imp,
	lit,
	modl,
	namedImport,
	propLookup,
	stmt,
	varDecl
} from "../dsl";
import { astToString } from "../walker";

function getColumnMetamodelName(column: ColumnMetadata): string {
	return `ColumnMetamodel<${ getColumnTypeScriptType(column) }>`;
}

function escapeColumnName(column: ColumnMetadata): string {
	return column.name.replace(/'/g, '\\\'');
}

export function TableMetamodelTemplate(table: TableMetadata): string {
	const rootNode = modl([
			imp([
				'ColumnMetamodel',
				'deepFreeze',
				'QueryTable',
				'TableMetamodel',
			].sort()
				.map((name) => namedImport(name)), 'rose')
		], body([
			stmt(
				classDecl(
					'T' + table.niceName,
					table.columns.map((col) => classProp(col.niceName, {
						expression: funcCall(
							id('new ' + getColumnMetamodelName(col)),
							[
								propLookup(
									id('this'),
									'$table'
								),
								lit(`'${ escapeColumnName(col) }'`)
							]
						)
					})),
					{
						exported: true,
						extends: [id('QueryTable')],
						constructor_: classConstr([
							classConstrParam('$tableAlias', {
								annotation: anno('string'),
								optional: true,
							})
						], body([
							stmt(funcCall(
								id('super'),
								[funcCall(
									id('new TableMetamodel'),
									[lit(`'${ table.name }'`), id(`$tableAlias`)]
								)]
							))
						]))
					})
			),
			stmt(varDecl(
				'const',
				'Q' + table.niceName,
				funcCall(
					id('deepFreeze'),
					[
						funcCall(
							id('new T' + table.niceName),
							[]
						)
					]
				),
				true
			))
		]),
		comment(`Generated file; do not manually edit, as your changes will be overwritten!`));
	return astToString(rootNode);
}

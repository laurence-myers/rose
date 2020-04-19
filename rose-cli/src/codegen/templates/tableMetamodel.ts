import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { metamodelClassName, metamodelInstanceName } from "./common";
import {
	anno,
	body,
	classConstr,
	classConstrParam,
	classDecl,
	classProp,
	funcCall,
	id,
	impAll,
	lit,
	modl,
	propLookup,
	stmt,
	varDecl
} from "../dsl";
import { ModuleNode } from "../ast";

function getColumnMetamodelName(column: ColumnMetadata): string {
	return `rose.ColumnMetamodel<${ column.tsType.type }>`;
}

function escapeColumnName(column: ColumnMetadata): string {
	return column.name.replace(/'/g, '\\\'');
}

export function TableMetamodelTemplate(table: TableMetadata): ModuleNode {
	return modl([
			impAll('@rose/rose', 'rose')
		], body([
			stmt(
				classDecl(
					metamodelClassName(table),
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
						extends: [id('rose.QueryTable')],
						constructor_: classConstr([
							classConstrParam('$tableAlias', {
								annotation: anno('string'),
								optional: true,
							})
						], body([
							stmt(funcCall(
								id('super'),
								[funcCall(
									id('new rose.TableMetamodel'),
									[lit(`'${ table.name }'`), id(`$tableAlias`)]
								)]
							))
						]))
					})
			),
			stmt(varDecl(
				'const',
				metamodelInstanceName(table),
				funcCall(
					id('rose.deepFreeze'),
					[
						funcCall(
							id('new ' + metamodelClassName(table)),
							[]
						)
					]
				),
				true
			))
		]));
}

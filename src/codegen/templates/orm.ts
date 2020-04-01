import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { allColumnsName, getColumnTypeScriptType, metamodelClassName, metamodelInstanceName, } from "./common";
import { CodeGeneratorError } from "../../errors";
import {
	anno,
	arrowFunc,
	body,
	funcCall,
	funcExpr,
	id,
	iface,
	ifaceProp,
	iife,
	invokeMethod,
	invokeMethodChain,
	modl,
	obj,
	objProp,
	param,
	propLookup,
	ret,
	stmt,
	varDecl
} from "../dsl";
import { InterfacePropertyNode, ObjectPropertyNode } from "../ast";
import { astToString } from "../walker";

function generateAllColumns(tableMetadata: TableMetadata) {
	return varDecl(
		'const',
		allColumnsName(tableMetadata),
		obj(
			tableMetadata.columns.map((column) => {
				const niceColumnName = column.niceName;
				return objProp(niceColumnName, propLookup(id(metamodelInstanceName(tableMetadata)), niceColumnName));
			})
		)
	);
}

function getParameter(name: string) {
	return invokeMethod(
		id('P'),
		'get',
		[
			arrowFunc(
				[param('p')],
				propLookup(id('p'), name)
			)
		]
	);
}

function primaryKeyToCriteria(table: TableMetadata, property: InterfacePropertyNode) {
	// Produces `QFooTable.id.eq(P.get((p) => p.id))`
	return funcCall(
		propLookup(
			id(metamodelInstanceName(table)),
			property.name,
			'eq'
		),
		[
			getParameter(property.name)
		]
	);
}

function primaryKeysToCriteria(table: TableMetadata, primaryKeys: InterfacePropertyNode[]) {
	const criteria = primaryKeys.map((primaryKey) => primaryKeyToCriteria(table, primaryKey));
	if (criteria.length > 1) {
		return funcCall(
			id('and'),
			criteria
		);
	} else {
		return criteria[0];
	}
}

function generateGetOne(table: TableMetadata): ObjectPropertyNode | undefined {
	if (table.primaryKeys.length === 0) {
		return undefined; // Can't look up a single row without a primary key.
	}
	const primaryKeys = mapPrimaryKeys(table);
	const criteria = primaryKeysToCriteria(table, primaryKeys);
	return objProp(
		'getOne',
		iife(
			[
				stmt(iface('Params', primaryKeys)),
				stmt(varDecl(
					'const',
					'P',
					funcCall(id('new ParamsWrapper<Params>'), [])
				)),
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`select<${ allColumnsName(table) }, Params>`),
							[id(allColumnsName(table))]
						),
						[
							[
								'where',
								[criteria]
							],
							[
								'prepare',
								[]
							]
						],
					)
				))
			],
			'getOne'
		)
	);
}

function generateInsertOne() {

}

function generateInsertMany() {

}

function generateUpdateOne(table: TableMetadata) {
	if (table.primaryKeys.length === 0) {
		return undefined; // Can't look up a single row without a primary key.
	}
	const primaryKeys = mapPrimaryKeys(table);
	const criteria = primaryKeysToCriteria(table, primaryKeys);

	return objProp(
		'updateOne',
		funcExpr(
			[
				param('updates', anno(`PartialTableColumns<${ metamodelClassName(table) }>`))
			],
			[
				stmt(iface('Params', primaryKeys)),
				stmt(varDecl(
					'const',
					'P',
					funcCall(id('new ParamsWrapper<Params>'), [])
				)),
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`updateFromObject<${ metamodelClassName(table) }, Params>`),
							[
								id(metamodelInstanceName(table)),
								id('updates')
							]
						),
						[
							[
								'where',
								[criteria]
							],
							[
								'prepare',
								[]
							]
						]
					)
				))
			],
			'updateOne'
		)
	);
}

function generateUpdateMany() {

}

function generateDeleteOne() {

}

function generateDeleteMany() {

}

function findColumnMetadataByName(tableMetadata: TableMetadata, columnName: string): ColumnMetadata {
	const column = tableMetadata.columns.find((col) => col.name === columnName);
	if (!column) {
		throw new CodeGeneratorError(`Column not found in table: ${ columnName } in ${ tableMetadata.name }`);
	}
	return column;
}

function getColumnNameAndType(columnMetadata: ColumnMetadata): InterfacePropertyNode {
	return ifaceProp(columnMetadata.niceName, anno(getColumnTypeScriptType(columnMetadata)));
}

function mapPrimaryKeys(tableMetadata: TableMetadata): InterfacePropertyNode[] {
	return tableMetadata.primaryKeys.map((columnName) => {
		const column = findColumnMetadataByName(tableMetadata, columnName);
		return getColumnNameAndType(column);
	});
}

export function OrmTemplate(tableMetadata: TableMetadata) {
	// TODO: support lookup by unique index
	const defaultQueriesProperties = [
		generateGetOne(tableMetadata),
		generateUpdateOne(tableMetadata),
	].filter((entry): entry is ObjectPropertyNode => entry !== undefined);

	const moduleNode = modl(
		[],
		body([
			stmt(generateAllColumns(tableMetadata)),
			stmt(varDecl(
				'const',
				tableMetadata.niceName + 'DefaultQueries',
				obj(defaultQueriesProperties)
			))
		])
	);

	return astToString(moduleNode);
}

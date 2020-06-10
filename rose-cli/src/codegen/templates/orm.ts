import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { allColumnsName, insertRowIfaceName, metamodelClassName, metamodelInstanceName, } from "./common";
import { CodeGeneratorError } from "../../errors";
import {
	anno,
	body,
	funcCall,
	funcExpr,
	id,
	iface,
	ifaceProp,
	iife,
	impAll,
	ImportNode,
	InterfacePropertyNode,
	invokeMethodChain,
	modl,
	ModuleNode,
	obj,
	ObjectPropertyNode,
	objProp,
	param,
	propLookup,
	ret,
	stmt,
	varDecl
} from "tscodegendsl";

function generateAllColumns(tableMetadata: TableMetadata) {
	return varDecl(
		'const',
		allColumnsName(tableMetadata),
		obj(
			tableMetadata.columns.map((column) => {
				const niceColumnName = column.niceName;
				return objProp(niceColumnName, propLookup(id(metamodelInstanceName(tableMetadata)), niceColumnName));
			})
		),
		true
	);
}

function getParameter(name: string) {
	return propLookup(
		id('P'),
		name,
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
			id('rose.and'),
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
					funcCall(id('rose.params<Params>'), [])
				)),
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`rose.select`),
							[id(allColumnsName(table))]
						),
						[
							[
								'where',
								[criteria]
							],
							[
								'finalise',
								[id('P')]
							]
						],
					)
				))
			],
			'getOne'
		)
	);
}

function generateInsertOne(table: TableMetadata) {
	return objProp(
		'insertOne',
		funcExpr(
			[
				param('row', anno(insertRowIfaceName(table)))
			],
			[
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`rose.insertFromObject<${ metamodelClassName(table) }, ${ insertRowIfaceName(table) }>`),
							[
								id(metamodelInstanceName(table)),
								id('row')
							]
						),
						[
							[
								'finalise',
								[obj([])]
							]
						]
					)
				))
			],
			'insertOne'
		)
	);
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
				param('updates', anno(`rose.PartialTableColumns<${ metamodelClassName(table) }>`))
			],
			[
				stmt(iface('Params', primaryKeys)),
				stmt(varDecl(
					'const',
					'P',
					funcCall(id('rose.params<Params>'), [])
				)),
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`rose.updateFromObject`),
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
								'finalise',
								[id('P')]
							]
						]
					)
				))
			],
			'updateOne'
		)
	);
}

function generateDeleteOne(table: TableMetadata) {
	if (table.primaryKeys.length === 0) {
		return undefined; // Can't look up a single row without a primary key.
	}
	const primaryKeys = mapPrimaryKeys(table);
	const criteria = primaryKeysToCriteria(table, primaryKeys);
	return objProp(
		'deleteOne',
		iife(
			[
				stmt(iface('Params', primaryKeys)),
				stmt(varDecl(
					'const',
					'P',
					funcCall(id('rose.params<Params>'), [])
				)),
				stmt(ret(
					invokeMethodChain(
						funcCall(
							id(`rose.deleteFrom`),
							[id(metamodelInstanceName(table))]
						),
						[
							[
								'where',
								[criteria]
							],
							[
								'finalise',
								[id('P')]
							]
						],
					)
				))
			],
			'deleteOne'
		)
	);
}

function findColumnMetadataByName(tableMetadata: TableMetadata, columnName: string): ColumnMetadata {
	const column = tableMetadata.columns.find((col) => col.name === columnName);
	if (!column) {
		throw new CodeGeneratorError(`Column not found in table: ${ columnName } in ${ tableMetadata.name }`);
	}
	return column;
}

function getColumnNameAndType(columnMetadata: ColumnMetadata): InterfacePropertyNode {
	return ifaceProp(columnMetadata.niceName, anno(columnMetadata.tsType.type));
}

function mapPrimaryKeys(tableMetadata: TableMetadata): InterfacePropertyNode[] {
	return tableMetadata.primaryKeys.map((columnName) => {
		const column = findColumnMetadataByName(tableMetadata, columnName);
		return getColumnNameAndType(column);
	});
}

export function OrmTemplate(tableMetadata: TableMetadata): ModuleNode {
	const imports: ImportNode[] = [
		impAll('@rosepg/rose', 'rose')
	];

	// TODO: support lookup by unique index
	const defaultQueriesProperties = [
		generateGetOne(tableMetadata),
		generateInsertOne(tableMetadata),
		generateUpdateOne(tableMetadata),
		generateDeleteOne(tableMetadata),
	].filter((entry): entry is ObjectPropertyNode => entry !== undefined);

	return modl(
		imports,
		body([
			stmt(generateAllColumns(tableMetadata)),
			stmt(varDecl(
				'const',
				tableMetadata.niceName + 'DefaultQueries',
				obj(defaultQueriesProperties),
				true
			))
		])
	);
}

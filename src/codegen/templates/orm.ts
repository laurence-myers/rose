import { ColumnMetadata, TableMetadata } from "../dbmetadata";
import { getColumnTypeScriptType, sanitizeColumnName, sanitizeTableName } from "./common";
import { CodeGeneratorError } from "../../errors";
import {
	anno,
	arrowFunc,
	body,
	funcCall,
	funcExpr,
	gexpr,
	id,
	iface,
	ifaceProp,
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
import { CodegenAstWalker } from "../walker";

function generateAllColumns(tableMetadata: TableMetadata) {
	const niceTableName = sanitizeTableName(tableMetadata.name);
	return varDecl(
		'const',
		niceTableName + 'AllColumns',
		obj(
			tableMetadata.columns.map((column) => {
				const niceColumnName = sanitizeColumnName(column.name);
				return objProp(niceColumnName, propLookup(id('Q' + niceTableName), niceColumnName));
			})
		)
	);
}

function primaryKeyToCriteria(niceTableName: string, property: InterfacePropertyNode) {
	// Produces `QFooTable.id.eq(P.get((p) => p.id))`
	return funcCall(
		propLookup(
			id('Q' + niceTableName),
			property.name,
			'eq'
		),
		[
			funcCall(
				propLookup(
					id('P'),
					'get'
				),
				[
					arrowFunc(
						[param('p')],
						propLookup(id('p'), property.name)
					)
				]
			)
		]
	);
}

function primaryKeysToCriteria(table: TableMetadata, primaryKeys: InterfacePropertyNode[]) {
	const criteria = primaryKeys.map((primaryKey) => primaryKeyToCriteria(table.niceName, primaryKey));
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
	const primaryKeys = mapPrimaryKeys(table);
	if (primaryKeys.length === 0) {
		return undefined; // Can't look up a single row without a primary key.
	}
	const criteria = primaryKeysToCriteria(table, primaryKeys);
	return objProp(
		'getOne',
		funcCall(
			gexpr(funcExpr(
				[],
				[
					stmt(iface('Params', primaryKeys)),
					stmt(varDecl(
						'const',
						'P',
						funcCall(id('new ParamsWrapper<Params>'), [])
					)),
					stmt(ret(
						funcCall(
							propLookup(funcCall(
								id('select'),
								[id(table.niceName + 'AllColumns')]
							), 'where'),
							[criteria]
						)
					))
				]
			)),
			[],
		)
	);
}

function generateInsertOne() {

}

function generateInsertMany() {

}

function generateUpdateOne() {

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
	// const primaryKey = generatePrimaryKey(tableMetadata);
	// const rowType = sanitizeTableName(tableMetadata.name) + `Row`;
	const defaultQueriesProperties = [];
	let property = generateGetOne(tableMetadata);
	if (property) {
		defaultQueriesProperties.push(property);
	}

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

	const walker = new CodegenAstWalker();
	return walker.walk(moduleNode);
}

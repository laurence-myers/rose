import "reflect-metadata";
import {InvalidTableDefinitionError, InvalidColumnDefinitionError} from "../errors";
import {getMetadata} from "../lang";
import {
	BooleanExpression, ColumnReferenceNode, ConstantNode, OrderByExpressionNode, BinaryOperationNode,
	BooleanBinaryOperationNode, BooleanUnaryOperationNode, SubSelectNode
} from "./ast";
import {TableMetadata} from "../dbmetadata";

export const METADATA_KEY_PREFIX = "arbaon.";
export const TABLE_METADATA_KEY = `${ METADATA_KEY_PREFIX }table`;
export function Table<T>(metamodel : TableMetamodel) : ClassDecorator {
	return function (target : Function) {
		if (Reflect.hasMetadata(TABLE_METADATA_KEY, target)) {
			throw new InvalidTableDefinitionError(`Class "${ target.name }" already has table metadata defined.`);
		} else {
			Reflect.defineMetadata(TABLE_METADATA_KEY, metamodel, target.prototype);
		}
	}
}

export const SELECT_METADATA_KEY = `${ METADATA_KEY_PREFIX }select`;
export function Column<T>(metamodel : ColumnMetamodel<any>) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		let metadata = getMetadata<Map<string, ColumnMetamodel<any>>>(SELECT_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, ColumnMetamodel<any>>();
			Reflect.defineMetadata(SELECT_METADATA_KEY, metadata, target);
		} else if (metadata.get(<string> propertyKey) !== undefined) {
			throw new InvalidColumnDefinitionError(`Property "${ propertyKey }" already has column metadata defined.`);
		}
		metadata.set(<string> propertyKey, metamodel);
	}
}

export class TableMetamodel {
	constructor(
		readonly name : string
	) {
	}
}

function isSubSelectNode(node : { type? : string }) : node is SubSelectNode {
	return node && node.type == 'subSelectNode';
}

export interface ColumnMetamodelOptions<R> {
	references : R;
}

export abstract class ColumnMetamodel<T> {
	constructor(
		readonly table : TableMetamodel,
		readonly name : string,
		readonly type : Function,
		private options? : ColumnMetamodelOptions<any>
	) {

	}

	asc() : OrderByExpressionNode {
		return {
			type: "orderByExpressionNode",
			expression: this.toColumnReferenceNode(),
			order: "asc"
		};
	}

	desc() : OrderByExpressionNode {
		return {
			type: "orderByExpressionNode",
			expression: this.toColumnReferenceNode(),
			order: "desc"
		};
	}

	protected createBooleanBinaryOperationNode(
		operator : '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IS DISTINCT FROM' | 'IS NOT DISTINCT FROM',
		value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		let right : ColumnReferenceNode | ConstantNode<T> | SubSelectNode;
		if (value instanceof ColumnMetamodel) {
			right = value.toColumnReferenceNode();
		} else if (isSubSelectNode(value)) {
			right = value;
		} else {
			right = <ConstantNode<T>> {
				type: 'constantNode',
				getter: value
			};
		}
		return {
			type: 'binaryOperationNode',
			left: this.toColumnReferenceNode(),
			right,
			operator
		};
	}

	eq(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('=', value);
	}

	neq(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('!=', value);
	}

	gt(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('>', value);
	}

	gte(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('>=', value);
	}

	lt(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('<', value);
	}

	lte(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('<=', value);
	}

	isDistinctFrom(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('IS DISTINCT FROM', value);
	}

	isNotDistinctFrom(value : ((params : any) => T) | ColumnMetamodel<T> | SubSelectNode) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('IS NOT DISTINCT FROM', value);
	}

	protected createBooleanUnaryOperationNode(operator : 'IS NULL'
		| 'IS NOT NULL'
		| 'IS TRUE'
		| 'IS NOT TRUE'
		| 'IS FALSE'
		| 'IS NOT FALSE'
		| 'IS UNKNOWN'
		| 'IS NOT UNKNOWN') : BooleanUnaryOperationNode {
		return {
			type: 'unaryOperationNode',
			expression: this.toColumnReferenceNode(),
			operator,
			position: 'right' // TODO: support left-hand unary operators
		};
	}

	isNull() : BooleanUnaryOperationNode {
		return this.createBooleanUnaryOperationNode('IS NULL');
	}

	isNotNull() {
		return this.createBooleanUnaryOperationNode('IS NOT NULL');
	}

	isTrue() {
		return this.createBooleanUnaryOperationNode('IS TRUE');
	}

	isNotTrue() {
		return this.createBooleanUnaryOperationNode('IS NOT TRUE');
	}

	isFalse() {
		return this.createBooleanUnaryOperationNode('IS FALSE');
	}

	isNotFalse() {
		return this.createBooleanUnaryOperationNode('IS NOT FALSE');
	}

	isUnknown() {
		return this.createBooleanUnaryOperationNode('IS UNKNOWN');
	}

	isNotUnknown() {
		return this.createBooleanUnaryOperationNode('IS NOT UNKNOWN');
	}

	toColumnReferenceNode() : ColumnReferenceNode {
		return {
			type: 'columnReferenceNode',
			columnName: this.name,
			tableName: this.table.name
		};
	}
}

export class NumericColumnMetamodel extends ColumnMetamodel<number> {

}

export class StringColumnMetamodel extends ColumnMetamodel<string> {

}

export interface QueryTable {
	$table : TableMetamodel;
}

export function getTableName(queryTable : Function) {
	const tableMetamodelMetadata = getMetadata<TableMetadata>(TABLE_METADATA_KEY, queryTable.prototype);
	if (!tableMetamodelMetadata) {
		throw new InvalidTableDefinitionError(`Table class "${ queryTable.name }" does not have any metadata.`);
	}
	return tableMetamodelMetadata.name;
}

export function getTableNameFromColumn(columnMetamodel : ColumnMetamodel<any>) : string {
	return columnMetamodel.table.name;
}

import "reflect-metadata";
import {InvalidTableDefinitionError, InvalidColumnDefinitionError} from "../errors";
import {getMetadata} from "../lang";
import {
	BooleanExpression, ColumnReferenceNode, ConstantNode, OrderByExpressionNode, BinaryOperationNode,
	BooleanBinaryOperationNode
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

	protected createBooleanBinaryOperationNode(operator : '=' | '!=' | '<' | '<=' | '>' | '>=', value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		let right : ColumnReferenceNode | ConstantNode<T>;
		if (value instanceof ColumnMetamodel) {
			right = value.toColumnReferenceNode();
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

	eq(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('=', value);
	}

	neq(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('!=', value);
	}

	gt(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('>', value);
	}

	gte(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('>=', value);
	}

	lt(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('<', value);
	}

	lte(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanBinaryOperationNode {
		return this.createBooleanBinaryOperationNode('<=', value);
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

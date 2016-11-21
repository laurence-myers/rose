import "reflect-metadata";
import {InvalidTableDefinitionError, InvalidColumnDefinitionError} from "../errors";
import {getMetadata} from "../lang";
import {BooleanExpressionNode, ColumnReferenceNode, ConstantNode} from "./ast";
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
		private name : string
	) {
	}
}

export interface ColumnMetamodelOptions<R> {
	references : R;
}

export abstract class ColumnMetamodel<T> {
	constructor(
		public table : Function, // hmm
		public name : string,
		public type : Function,
		private options? : ColumnMetamodelOptions<any>
	) {

	}

	eq(value : ((params : any) => T) | ColumnMetamodel<T>) : BooleanExpressionNode {
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
			type: 'booleanExpressionNode',
			left: this.toColumnReferenceNode(),
			right,
			operator: '=' // TODO
		};
	}

	protected toColumnReferenceNode() : ColumnReferenceNode {
		return {
			type: 'columnReferenceNode',
			columnName: this.name,
			tableName: getTableName(this.table)
		};
	}
}

export class NumericColumnMetamodel extends ColumnMetamodel<number> {

}

export function getTableName(queryTable : Function) {
	const tableMetamodelMetadata = getMetadata<TableMetadata>(TABLE_METADATA_KEY, queryTable.prototype);
	if (!tableMetamodelMetadata) {
		throw new InvalidTableDefinitionError(`Table class "${ queryTable.name }" does not have any metadata.`);
	}
	return tableMetamodelMetadata.name;
}

export function getTableNameFromColumn(columnMetamodel : ColumnMetamodel<any>) : string {
	const queryTable = columnMetamodel.table;
	return getTableName(queryTable);
}

import "reflect-metadata";
import {InvalidTableDefinitionError, InvalidColumnDefinitionError} from "../errors";
import {Operator, WhereExpression} from "./dsl";
import {getMetadata} from "../lang";

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

	eq(value : T | ColumnMetamodel<T>) : WhereExpression<T> {
		return {
			left: this,
			right: value,
			operator: Operator.Equals
		};
	}
}

export class NumericColumnMetamodel extends ColumnMetamodel<number> {

}

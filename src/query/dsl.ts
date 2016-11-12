import "reflect-metadata";
import {ColumnMetamodel, TABLE_METADATA_KEY, SELECT_METADATA_KEY, METADATA_KEY_PREFIX} from "./metamodel";
import {DefaultMap, getMetadata, getType} from "../lang";
import {
	InvalidTableDefinitionError, InvalidQueryClassError, RowMappingError,
	UnsupportedOperationError, InvalidQueryNestedClassError
} from "../errors";
import {TableMetadata} from "../dbmetadata";

export const NESTED_METADATA_KEY = `${ METADATA_KEY_PREFIX }nested`;
export function Nested<T extends Function>(nestedClass? : T) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		const type = getType(target, propertyKey);
		const isArray = type == Array;
		if (isArray && !nestedClass) {
			throw new InvalidQueryNestedClassError(`When nesting an array, you must pass the nested class as an argument to the decorator.`);
		}
		let metadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, NestedQuery>();
			Reflect.defineMetadata(NESTED_METADATA_KEY, metadata, target);
		} else if (metadata.get(<string> propertyKey) !== undefined) {
			throw new InvalidQueryNestedClassError(`Property "${ propertyKey }" already has nested metadata defined.`);
		}
		const nestedQuery = new NestedQuery(isArray ? nestedClass : <any>type, isArray);
		metadata.set(<string> propertyKey, nestedQuery);
	}
}

export class NestedQuery {
	constructor(
		public queryClass : Function,
		public isArray : boolean
	) {

	}
}

export const enum Operator {
	Equals
}

export const enum SqlCommand {
	Select,
	Insert,
	Update,
	Delete
}

interface QueryClass {
	new() : any;
}

interface TableClause {
	name : string;
	alias : string;
}

interface SelectClause {
	// Naive, doesn't allow aggregates, functions, etc.
	tableAlias : string;
	column : string;
	alias : string;
}

export type WhereExpression<T, P> = BooleanExpression<T, P>;

export type PropertyGetter<P, T> = (params : P) => T;
export type ExpressionValue<T, P> = ColumnMetamodel<T> | PropertyGetter<P, T>;

export interface BooleanExpression<T, P> {
	left : ExpressionValue<T, P>;
	operator : Operator;
	right : ExpressionValue<T, P>;
}

interface GeneratedQuery {
	sql : string;
	parameters : any[];
}

function isColumnMetamodel(value : any | ColumnMetamodel<any>) : value is ColumnMetamodel<any> {
	return value instanceof ColumnMetamodel;
}

class QueryBuilder<T extends QueryClass, P> {
	protected selectValues : SelectClause[] = [];
	protected tables : TableClause[] = [];
	protected tableMap = new DefaultMap<string, string>((key) => `t${ this.tables.length + 1 }`);
	protected whereExpression : WhereExpression<any, any>;

	constructor(private command : SqlCommand, private queryClass : T) {
		this.select();
	}

	protected getTableName(columnMetamodel : ColumnMetamodel<any>) : string {
		const queryTable = columnMetamodel.table;
		const tableMetamodelMetadata = getMetadata<TableMetadata>(TABLE_METADATA_KEY, queryTable.prototype);
		if (!tableMetamodelMetadata) {
			throw new InvalidTableDefinitionError(`Table class "${ queryTable.name }" does not have any metadata.`);
		}
		const tableName = tableMetamodelMetadata.name;
		return tableName;
	}

	protected getQualifiedColumnName(columnMetamodel : ColumnMetamodel<any>) : string {
		const tableName = this.getTableName(columnMetamodel);
		const tableAlias = this.tableMap.get(tableName);
		return `"${ tableAlias }"."${ columnMetamodel.name }"`;
	}

	private processSelectMetadata(entries : IterableIterator<[string, ColumnMetamodel<any>]>, aliasPrefix? : string) : void {
		for (const entry of entries) {
			const columnMetamodel : ColumnMetamodel<any> = entry[1];
			const columnName = columnMetamodel.name;
			const columnAlias : string = aliasPrefix ? `${ aliasPrefix }.${ entry[0] }` : entry[0];
			const tableName = this.getTableName(columnMetamodel);
			const tableAlias = this.tableMap.get(tableName);

			this.tables.push({
				name: tableName,
				alias: tableAlias
			});
			this.selectValues.push({
				tableAlias,
				column: columnName,
				alias: columnAlias
			});
		}
	}

	private processNestedMetadata(entries : IterableIterator<[string, NestedQuery]>) : void {
		for (const entry of entries) {
			const aliasPrefix : string = entry[0];
			const nestedQuery : NestedQuery = entry[1];
			const selectMetadata = this.getSelectMetadata(nestedQuery.queryClass);
			this.processSelectMetadata(selectMetadata.entries(), aliasPrefix);
		}
	}

	private getSelectMetadata(queryClass : Function) : Map<string, ColumnMetamodel<any>> {
		const selectMetadata = getMetadata<Map<string, ColumnMetamodel<any>>>(SELECT_METADATA_KEY, queryClass.prototype);
		if (!selectMetadata) {
			throw new InvalidQueryClassError("The class provided to the select function does not have any column decorators.");
		}
		return selectMetadata;
	}

	protected select() : this {
		const selectMetadata = this.getSelectMetadata(this.queryClass);
		const entries : IterableIterator<[string, ColumnMetamodel<any>]> = selectMetadata.entries();
		this.processSelectMetadata(entries);
		const nestedMetadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, this.queryClass.prototype);
		if (nestedMetadata) {
			this.processNestedMetadata(nestedMetadata.entries());
		}
		return this;
	}

	where(whereExpression : WhereExpression<any, any>) : this {
		this.whereExpression = whereExpression;
		return this;
	}

	and() : this {
		return this;
	}

	or() : this {
		return this;
	}

	not() : this {
		return this;
	}

	execute() : T[] {
		const rows = [{
			id: 1
		}];
		return rows.map((r) => this.mapRow(r));
	}

	protected mapRow(row : any) : T {
		const output = new this.queryClass();
		for (let key of this.selectValues.keys()) {
			if (row[key] === undefined) { // allow null
				throw new RowMappingError(`Selected property "${ key }" is not present in the row. Available properties: ${ Object.keys(row).join(', ') }`);
			}
			output[key] = row[key]; // TODO: parse string values, if required.
		}
		return output;
	}

	protected resolveExpressionValue(value : ExpressionValue<any, any>, params : P, parameterValues : any[]) : string {
		if (isColumnMetamodel(value)) {
			return this.getQualifiedColumnName(value);
		} else {
			parameterValues.push(value(params));
			return `$${ parameterValues.length }`;
		}
	}

	toSql(params : P) : GeneratedQuery {
		const columnsString = this.selectValues.map((c) => `"${ c.tableAlias }"."${ c.column }" as "${ c.alias }"`).join(`, `);
		const tablesString = this.tables.map((t) => `"${ t.name }" as "${ t.alias }"`).join(`, `);
		let whereString : string;
		let parameterValues : any[] = [];
		if (this.whereExpression) {
			whereString = ` WHERE (`;
			// if (whereExpression instanceof BooleanExpression) {
				switch (this.whereExpression.operator) {
					case Operator.Equals:
						// TODO: sanitized values?
						whereString += `${ this.resolveExpressionValue(this.whereExpression.left, params, parameterValues) } = ${ this.resolveExpressionValue(this.whereExpression.right, params, parameterValues) }`;
						break;
					default:
						throw new UnsupportedOperationError(`Unrecognised where clause operator: ${ this.whereExpression.operator }`);
				}
			// }
			whereString += `)`;
		} else {
			whereString = '';
		}
		const sql = `SELECT ${ columnsString } FROM ${ tablesString }${ whereString }`;
		return {
			sql,
			parameters: parameterValues
		};
	}
}

export function select<T extends QueryClass, P>(queryClass : T) : QueryBuilder<T, P> {
	return new QueryBuilder<T, P>(SqlCommand.Select, queryClass);
}

import "reflect-metadata";
import {
	ColumnMetamodel, SELECT_METADATA_KEY, METADATA_KEY_PREFIX,
	getTableNameFromColumn
} from "./metamodel";
import {DefaultMap, getMetadata, getType} from "../lang";
import {
	InvalidQueryClassError, InvalidQueryNestedClassError
} from "../errors";
import {SelectCommandNode, BooleanExpressionNode} from "./ast";
import {AstWalker} from "./walker";

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

export const enum SqlCommand {
	Select,
	Insert,
	Update,
	Delete
}

interface QueryClass {
	new() : any;
}

export interface GeneratedQuery {
	sql : string;
	parameters : any[];
}

class QueryBuilder<T extends QueryClass, P> {
	protected tableMap = new DefaultMap<string, string>((key) => `t${ this.queryAst.fromItems.length + 1 }`);
	protected queryAst : SelectCommandNode;

	constructor(private command : SqlCommand, private queryClass : T) {
		this.select();
	}

	protected processSelectMetadata(entries : IterableIterator<[string, ColumnMetamodel<any>]>, aliasPrefix? : string) : void {
		for (const entry of entries) {
			const columnMetamodel : ColumnMetamodel<any> = entry[1];
			const columnName = columnMetamodel.name;
			const columnAlias : string = aliasPrefix ? `${ aliasPrefix }.${ entry[0] }` : entry[0];
			const tableName = getTableNameFromColumn(columnMetamodel);
			const tableAlias = this.tableMap.get(tableName);

			this.queryAst.fromItems.push({
				type: 'fromItemNode',
				tableName: tableName,
				alias: tableAlias
			});
			this.queryAst.outputExpressions.push({
				type: 'columnReferenceNode',
				tableName: tableName,
				columnName: columnName,
				alias: columnAlias
			});
		}
	}

	protected processNestedMetadata(entries : IterableIterator<[string, NestedQuery]>) : void {
		for (const entry of entries) {
			const aliasPrefix : string = entry[0];
			const nestedQuery : NestedQuery = entry[1];
			const selectMetadata = this.getSelectMetadata(nestedQuery.queryClass);
			this.processSelectMetadata(selectMetadata.entries(), aliasPrefix);
		}
	}

	protected getSelectMetadata(queryClass : Function) : Map<string, ColumnMetamodel<any>> {
		const selectMetadata = getMetadata<Map<string, ColumnMetamodel<any>>>(SELECT_METADATA_KEY, queryClass.prototype);
		if (!selectMetadata) {
			throw new InvalidQueryClassError("The class provided to the select function does not have any column decorators.");
		}
		return selectMetadata;
	}

	protected select() : this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: [],
			fromItems: [],
			conditions: []
		};
		const selectMetadata = this.getSelectMetadata(this.queryClass);
		const entries : IterableIterator<[string, ColumnMetamodel<any>]> = selectMetadata.entries();
		this.processSelectMetadata(entries);
		const nestedMetadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, this.queryClass.prototype);
		if (nestedMetadata) {
			this.processNestedMetadata(nestedMetadata.entries());
		}
		return this;
	}

	where(whereExpression : BooleanExpressionNode) : this {
		// Rectify table aliases. Crap, need to work out a better way to do this
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	/*execute() : T[] {
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
	}*/

	toSql(params : P) : GeneratedQuery {
		const walker = new AstWalker(this.queryAst, this.tableMap, params);
		return walker.toSql();
	}
}

export function select<T extends QueryClass, P>(queryClass : T) : QueryBuilder<T, P> {
	return new QueryBuilder<T, P>(SqlCommand.Select, queryClass);
}

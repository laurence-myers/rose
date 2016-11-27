import "reflect-metadata";
import {
	ColumnMetamodel, SELECT_METADATA_KEY, METADATA_KEY_PREFIX,
	getTableNameFromColumn, getTableName, QueryTable
} from "./metamodel";
import {DefaultMap, getMetadata, getType} from "../lang";
import {
	InvalidQueryClassError, InvalidDecoratorError
} from "../errors";
import {
	SelectCommandNode, BooleanExpressionNode, OrderByExpressionNode, FunctionExpressionNode,
	ValueExpressionNode
} from "./ast";
import {AstWalker} from "./walker";

export const NESTED_METADATA_KEY = `${ METADATA_KEY_PREFIX }nested`;
export function Nested<T extends Function>(nestedClass? : T) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		const type = getType(target, propertyKey);
		const isArray = type == Array;
		if (isArray && !nestedClass) {
			throw new InvalidDecoratorError(`When nesting an array, you must pass the nested class as an argument to the decorator.`);
		}
		let metadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, NestedQuery>();
			Reflect.defineMetadata(NESTED_METADATA_KEY, metadata, target);
		} else if (metadata.get(<string> propertyKey) !== undefined) {
			throw new InvalidDecoratorError(`Property "${ propertyKey }" already has nested metadata defined.`);
		}
		const nestedQuery = new NestedQuery(isArray ? nestedClass : <any>type, isArray);
		metadata.set(<string> propertyKey, nestedQuery);
	}
}

export const EXPRESSION_METADATA_KEY = `${ METADATA_KEY_PREFIX }expression`;
export function Expression(functionExpressionNode : ValueExpressionNode) : PropertyDecorator {
	return function (target : Object, propertyKey : string | symbol) {
		let metadata = getMetadata<Map<string, ValueExpressionNode>>(EXPRESSION_METADATA_KEY, target);
		if (!metadata) {
			metadata = new Map<string, ValueExpressionNode>();
			Reflect.defineMetadata(EXPRESSION_METADATA_KEY, metadata, target);
		} else if (metadata.get(<string> propertyKey) !== undefined) {
			throw new InvalidDecoratorError(`Property "${ propertyKey }" already has an expression metadata defined.`);
		}
		metadata.set(<string> propertyKey, functionExpressionNode);
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
			this.processSelectQueryClass(nestedQuery.queryClass, aliasPrefix);
		}
	}

	protected processExpressionMetadata(entries : IterableIterator<[string, ValueExpressionNode]>) : void {
		for (const entry of entries) {
			const alias : string = entry[0];
			const expression : ValueExpressionNode = entry[1];
			// TODO: resolve table references within the expression?
			// TODO: support the property name as the alias
			this.queryAst.outputExpressions.push(expression);
		}
	}

	protected getSelectMetadata(queryClass : Function) : Map<string, ColumnMetamodel<any>> | undefined {
		const selectMetadata = getMetadata<Map<string, ColumnMetamodel<any>>>(SELECT_METADATA_KEY, queryClass.prototype);
		return selectMetadata;
	}

	protected processSelectQueryClass(queryClass : Function, aliasPrefix? : string) {
		const selectMetadata = this.getSelectMetadata(queryClass);
		if (selectMetadata) {
			this.processSelectMetadata(selectMetadata.entries(), aliasPrefix);
		}
		const nestedMetadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, queryClass.prototype);
		if (nestedMetadata) {
			this.processNestedMetadata(nestedMetadata.entries());
		}
		const expressionMetadata = getMetadata<Map<string, FunctionExpressionNode>>(EXPRESSION_METADATA_KEY, queryClass.prototype);
		if (expressionMetadata) {
			this.processExpressionMetadata(expressionMetadata.entries());
		}
		if (!selectMetadata && !nestedMetadata && !expressionMetadata) {
			throw new InvalidQueryClassError("The class provided to the select function does not have any output columns, expressions, or nested queries.");
		}
	}

	protected select() : this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: [],
			fromItems: [],
			conditions: [],
			ordering: []
		};
		this.processSelectQueryClass(this.queryClass);
		return this;
	}

	from(first : QueryTable, ...rest: QueryTable[]) : this {
		for (const qtable of [first].concat(rest)) {
			const tableName = qtable.$table.name;
			this.queryAst.fromItems.push({
				type: 'fromItemNode',
				tableName: tableName,
				alias: this.tableMap.get(tableName)
			});
		}
		return this;
	}

	where(whereExpression : BooleanExpressionNode) : this {
		// Rectify table aliases. Crap, need to work out a better way to do this
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	orderBy(first : OrderByExpressionNode, ...rest : OrderByExpressionNode[]) : this {
		this.queryAst.ordering.push(first);
		if (rest && rest.length > 0) {
			rest.forEach((node) => this.queryAst.ordering.push(node));
		}
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

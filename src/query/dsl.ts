import "reflect-metadata";
import {
	ColumnMetamodel, SELECT_METADATA_KEY, METADATA_KEY_PREFIX,
	QueryTable
} from "./metamodel";
import {DefaultMap, getMetadata, getType} from "../lang";
import {
	InvalidQueryClassError, InvalidDecoratorError, UnsupportedOperationError
} from "../errors";
import {
	SelectCommandNode, BooleanExpression, OrderByExpressionNode, FunctionExpressionNode,
	ValueExpressionNode, AliasedExpressionNode, ColumnReferenceNode, JoinNode,
	NotExpressionNode, BooleanExpressionGroupNode, SelectOutputExpression, SubSelectNode
} from "./ast";
import {SqlAstWalker, RectifyingWalker} from "./walker";

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

export interface HasLimit {
	limit? : number;
	offset? : number;
}

class JoinBuilder<TResult> {
	protected joinType : 'inner' | 'left' | 'right' | 'full' | 'cross' = 'inner';
	protected onNode : BooleanExpression;
	protected usingNodes : ColumnReferenceNode[];

	constructor(
		protected tableMap : DefaultMap<string, string>,
		protected qtable : QueryTable,
		protected callback : (joinNode : JoinNode) => TResult) {
	}

	inner() : this {
		this.joinType = 'inner';
		return this;
	}

	left() : this {
		this.joinType = 'left';
		return this;
	}

	right() : this {
		this.joinType = 'right';
		return this;
	}

	full() : this {
		this.joinType = 'full';
		return this;
	}

	cross() {
		this.joinType = 'cross';
		return this.build();
	}

	on(expression : BooleanExpression) {
		this.onNode = expression;
		return this.build();
	}

	using(...columns : ColumnMetamodel<any>[]) {
		if (columns && columns.length > 0) {
			this.usingNodes = columns.map((column) => column.toColumnReferenceNode());
		}
		return this.build();
	}

	protected build() : TResult {
		if (this.onNode && this.usingNodes) {
			throw new UnsupportedOperationError(`Cannot join tables with both "on" and "using" criteria.`);
		} else if (this.joinType == 'cross' && (this.onNode || this.usingNodes)) {
			throw new UnsupportedOperationError(`Cannot make a cross join with "on" or "using" criteria.`);
		}
		const tableName = this.qtable.$table.name;
		const joinNode : JoinNode = {
			type: 'joinNode',
			joinType: this.joinType,
			fromItem: {
				type: 'fromItemNode',
				tableName: tableName,
				alias: this.tableMap.get(tableName)
			},
			on: this.onNode,
			using: this.usingNodes
		};
		return this.callback(joinNode);
	}
}

class BaseQueryBuilder<TParams extends HasLimit> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst : SelectCommandNode;

	/**
	 * Adds referenced tables as "FROM" clauses for any tables not explicitly joined/from-ed.
	 */
	protected rectifyTableReferences() {
		const rectifier = new RectifyingWalker(this.queryAst, this.tableMap);
		rectifier.rectify();
	}

	distinct() : this {
		this.queryAst.distinction = 'distinct';
		return this;
	}

	from(first : QueryTable, ...rest: QueryTable[]) : this {
		for (const qtable of [first].concat(rest)) {
			const tableName = qtable.$table.name;
			this.queryAst.fromItems.push({
				type: 'fromItemNode',
				tableName: tableName,
				alias: qtable.$table.alias || this.tableMap.get(tableName)
			});
		}
		return this;
	}

	join(queryTable : QueryTable) : JoinBuilder<this> {
		return new JoinBuilder(this.tableMap, queryTable, (joinNode) => {
			this.queryAst.joins.push(joinNode);
			return this;
		});
	}

	where(whereExpression : BooleanExpression) : this {
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

	limit() : this {
		this.queryAst.limit = {
			type: 'limitOffsetNode',
			limit: {
				type: 'constantNode',
				getter: (params) => params.limit
			},
			offset: {
				type: 'constantNode',
				getter: (params) => params.offset || 0
			}
		};
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
}

class QueryBuilder<TQueryClass extends QueryClass, TParams extends HasLimit> extends BaseQueryBuilder<TParams> {
	constructor(private command : SqlCommand, private queryClass : TQueryClass) {
		super();
		this.select();
	}

	protected processSelectMetadata(entries : IterableIterator<[string, ColumnMetamodel<any>]>, aliasPrefix? : string) : void {
		for (const entry of entries) {
			const columnMetamodel : ColumnMetamodel<any> = entry[1];
			const columnAlias : string = aliasPrefix ? `${ aliasPrefix }.${ entry[0] }` : entry[0];

			this.queryAst.outputExpressions.push({
				type: 'aliasedExpressionNode',
				alias: columnAlias,
				expression: columnMetamodel.toColumnReferenceNode()
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
			const aliasedExpressionNode : AliasedExpressionNode = {
				type: 'aliasedExpressionNode',
				alias,
				expression
			};
			this.queryAst.outputExpressions.push(aliasedExpressionNode);
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
			joins: [],
			conditions: [],
			ordering: []
		};
		this.processSelectQueryClass(this.queryClass);
		return this;
	}

	prepare() : PreparedQuery<TParams> {
		this.rectifyTableReferences();
		const walker = new SqlAstWalker(this.queryAst, this.tableMap);
		const data = walker.prepare();
		return new PreparedQuery<TParams>(data.sql, data.parameterGetters);
	}

	toSql(params : TParams) : GeneratedQuery {
		return this.prepare().generate(params);
	}
}

class PreparedQuery<TParams> {

	constructor(
		protected readonly sql : string,
		protected readonly paramGetters : Array<(params : TParams) => any>) {

	}

	generate(params : TParams) : GeneratedQuery {
		const values = this.paramGetters.map((getter) => getter(params));
		return {
			sql: this.sql,
			parameters: values
		};
	}
}

// TODO: how to reference expressions defined outside of this sub-query?
class SubQueryBuilder<TParams extends HasLimit> extends BaseQueryBuilder<TParams> {
	constructor(private command : SqlCommand, subSelectExpressions : SubSelectExpression[]) {
		super();
		this.select(subSelectExpressions);
	}

	protected processSubSelectExpressions(subSelectExpressions : SubSelectExpression[]) {
		for (let outputExpression of subSelectExpressions) {
			if (outputExpression instanceof ColumnMetamodel) {
				this.queryAst.outputExpressions.push(outputExpression.toColumnReferenceNode());
			} else {
				this.queryAst.outputExpressions.push(outputExpression);
			}
		}
	}

	protected select(subSelectExpressions : SubSelectExpression[]) : this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: [],
			fromItems: [],
			joins: [],
			conditions: [],
			ordering: []
		};
		this.processSubSelectExpressions(subSelectExpressions);
		return this;
	}

	toSubQuery() : SubSelectNode {
		// TODO: merge the tableMaps so sub-queries can refer to outer tables.
		return {
			type: 'subSelectNode',
			query: this.queryAst
		};
	}
}

export function select<TQueryClass extends QueryClass, TParams>(queryClass : TQueryClass) : QueryBuilder<TQueryClass, TParams> {
	return new QueryBuilder<TQueryClass, TParams>(SqlCommand.Select, queryClass);
}

type SubSelectExpression = SelectOutputExpression | ColumnMetamodel<any>;

export function subSelect<TParams>(...outputExpressions : SubSelectExpression[]) {
	return new SubQueryBuilder<TParams>(SqlCommand.Select, outputExpressions);
}

export function and(first : BooleanExpression, second : BooleanExpression, ...rest : BooleanExpression[]) : BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'and',
		expressions: [first, second].concat(rest)
	};
}

export function or(first : BooleanExpression, second : BooleanExpression, ...rest : BooleanExpression[]) : BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'or',
		expressions: [first, second].concat(rest)
	};
}

export function not(expr : BooleanExpression) : NotExpressionNode {
	return {
		type: 'notExpressionNode',
		expression: expr
	};
}

import "reflect-metadata";
import {ColumnMetamodel, METADATA_KEY_PREFIX, QueryTable} from "./metamodel";
import {Clone, DefaultMap, getMetadata, getType} from "../lang";
import {InvalidDecoratorError, UnsupportedOperationError} from "../errors";
import {
	BooleanExpression,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
	ConstantNode,
	ExpressionListNode,
	JoinNode,
	LiteralNode,
	NotExpressionNode,
	OrderByExpressionNode,
	ParameterOrValueExpressionNode,
	SelectCommandNode,
	SelectOutputExpression,
	SubSelectNode
} from "./ast";
import {RectifyingWalker, SqlAstWalker} from "./walker";
import {QuerySelectorProcessor} from "./metadata";
// import {execute, Queryable} from "../execution/execution";
import {QuerySelector, SelectorExpression, SelectorNested} from "./querySelector";
//
// export const NESTED_METADATA_KEY = `${ METADATA_KEY_PREFIX }nested`;
// export function Nested<T extends Function>(nestedClass? : T) : PropertyDecorator {
// 	return function (target : Object, propertyKey : string | symbol) {
// 		const type = getType(target, propertyKey);
// 		const isArray = type == Array;
// 		if (isArray && !nestedClass) {
// 			throw new InvalidDecoratorError(`When nesting an array, you must pass the nested class as an argument to the decorator.`);
// 		}
// 		let metadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, target);
// 		if (!metadata) {
// 			metadata = new Map<string, NestedQuery>();
// 			Reflect.defineMetadata(NESTED_METADATA_KEY, metadata, target);
// 		} else if (metadata.get(<string> propertyKey) !== undefined) {
// 			throw new InvalidDecoratorError(`Property "${ propertyKey }" already has nested metadata defined.`);
// 		}
// 		const nestedQuery = new NestedQuery(isArray ? nestedClass : <any>type, isArray);
// 		metadata.set(<string> propertyKey, nestedQuery);
// 	}
// }

export const enum SqlCommand {
	Select,
	Insert,
	Update,
	Delete
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
	protected onNode? : BooleanExpression;
	protected usingNodes? : ColumnReferenceNode[];

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
		const alias = this.tableMap.get(tableName);
		const joinNode : JoinNode = {
			type: 'joinNode',
			joinType: this.joinType,
			fromItem: {
				type: 'aliasedExpressionNode',
				alias,
				aliasPath: [alias],
				expression: {
					type: 'tableReferenceNode',
					tableName: tableName,
				}
			},
			on: this.onNode,
			using: this.usingNodes
		};
		return this.callback(joinNode);
	}
}

abstract class BaseQueryBuilder<TParams extends HasLimit> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst : SelectCommandNode = {
		type: 'selectCommandNode',
		distinction: 'all',
		outputExpressions: [],
		fromItems: [],
		joins: [],
		conditions: [],
		ordering: []
	};

	/**
	 * Adds referenced tables as "FROM" clauses for any tables not explicitly joined/from-ed.
	 */
	protected rectifyTableReferences() {
		const rectifier = new RectifyingWalker(this.queryAst, this.tableMap);
		rectifier.rectify();
	}

	@Clone()
	distinct() : this {
		this.queryAst.distinction = 'distinct';
		return this;
	}

	@Clone()
	distinctOn(expression : ParameterOrValueExpressionNode) : this {
		this.queryAst.distinction = 'on';
		this.queryAst.distinctOn = expression;
		return this;
	}

	@Clone()
	from(first : QueryTable, ...rest: QueryTable[]) : this {
		for (const qtable of [first].concat(rest)) {
			const tableName = qtable.$table.name;
			const alias = qtable.$table.alias || this.tableMap.get(tableName);
			this.queryAst.fromItems.push({
				type: 'aliasedExpressionNode',
				alias,
				aliasPath: [alias],
				expression: {
					type: 'tableReferenceNode',
					tableName: tableName,
				}
			});
		}
		return this;
	}

	@Clone()
	join(queryTable : QueryTable) : JoinBuilder<this> {
		return new JoinBuilder(this.tableMap, queryTable, (joinNode) => {
			this.queryAst.joins.push(joinNode);
			return this;
		});
	}

	@Clone()
	where(whereExpression : BooleanExpression) : this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	@Clone()
	orderBy(first : OrderByExpressionNode, ...rest : OrderByExpressionNode[]) : this {
		this.queryAst.ordering.push(first);
		if (rest && rest.length > 0) {
			rest.forEach((node) => this.queryAst.ordering.push(node));
		}
		return this;
	}

	@Clone()
	limit(limitNum? : number) : this {
		this.queryAst.limit = {
			type: 'limitOffsetNode',
			limit: {
				type: 'constantNode',
				getter: limitNum !== undefined ? p => limitNum : p => p.limit
			},
			offset: {
				type: 'constantNode',
				getter: (params) => params.offset || 0
			}
		};
		return this;
	}
}

class QueryBuilder<TParams extends HasLimit> extends BaseQueryBuilder<TParams> {
	constructor(private command : SqlCommand, private querySelector : QuerySelector) {
		super();
		this.select();
	}

	protected processQuerySelector() : Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(this.querySelector);
		return processor.process();
	}

	protected select() : this {
		this.queryAst = {
			type: 'selectCommandNode',
			distinction: 'all',
			outputExpressions: this.processQuerySelector(),
			fromItems: [],
			joins: [],
			conditions: [],
			ordering: []
		};
		return this;
	}

	prepare() : PreparedQuery<TParams> {
		this.rectifyTableReferences();
		const walker = new SqlAstWalker(this.queryAst, this.tableMap);
		const data = walker.prepare();
		return new PreparedQuery<TParams>(this.queryAst.outputExpressions, data.sql, data.parameterGetters);
	}

	toSql(params : TParams) : GeneratedQuery {
		return this.prepare().generate(params);
	}

	// execute(queryable : Queryable, params : TParams) : Promise<TQueryClass[]> {
	// 	return this.prepare().execute(queryable, params);
	// }
}

class PreparedQuery<TParams> {
	constructor(
		// protected readonly queryClass : Constructor<TDataClass>,
		protected readonly selectOutputExpressions : SelectOutputExpression[],
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

	// execute(queryable : Queryable, params : TParams) : Promise<TDataClass[]> {
	// 	return execute(queryable, this.generate(params), this.queryClass, this.selectOutputExpressions);
	// }
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

export function select<TParams>(querySelector : QuerySelector) : QueryBuilder<TParams> {
	return new QueryBuilder<TParams>(SqlCommand.Select, querySelector);
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

export function col(column : ColumnMetamodel<any>) : ColumnReferenceNode {
	return column.toColumnReferenceNode();
}

export function constant(value : number | string) : ConstantNode<number | string> {
	return {
		type: "constantNode",
		getter: () => value
	};
}

export function param<P, R>(getter : (params : P) => R) : ConstantNode<R> {
	return {
		type: "constantNode",
		getter: getter
	};
}

export class ParamsWrapper<P> {
	get<R>(getter : (params : P) => R) : ConstantNode<R> {
		return param(getter);
	}
}

export function literal(value : string) : LiteralNode {
	return {
		type: "literalNode",
		value
	};
}
export function row(first : ParameterOrValueExpressionNode, ...rest : ParameterOrValueExpressionNode[]) : ExpressionListNode {
	return {
		type: "expressionListNode",
		expressions: [first].concat(rest)
	};
}

export function selectExpression(expression : ParameterOrValueExpressionNode) : SelectorExpression {
	return {
		$selectorKind: 'expression',
		expression
	};
}

export function selectNested(querySelector : QuerySelector, constructor : Function, isArray : boolean) : SelectorNested {
	return {
		$selectorKind: 'nested',
		nestedSelector: {
			querySelector,
			constructor,
			isArray
		}
	};
}
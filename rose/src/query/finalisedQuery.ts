import { execute, executeNonReturning, Queryable } from "../execution";
import { QuerySelector } from "./querySelector";
import { AnyCommandNode, DeleteCommandNode, SelectCommandNode, SelectOutputExpression } from "./ast";
import { RectifyingWalker } from "./walkers/rectifyingWalker";
import { DefaultMap } from "../lang";
import { SqlAstWalker } from "./walkers/sqlAstWalker";
import { QuerySelectorProcessor } from "./metadata";
import { ParamsProxy, ParamsWrapper } from "./params";
import { TableMap } from "../data";

export interface GeneratedQuery {
	sql: string;
	parameters: unknown[];
}

export abstract class FinalisedQuery<TQuerySelector extends QuerySelector> {
	protected readonly outputExpressions: SelectOutputExpression[];
	protected readonly sql: string;
	protected readonly paramGetters: Array<(params: unknown) => unknown>;

	constructor(
		protected readonly querySelector: TQuerySelector,
		protected readonly queryAst: AnyCommandNode,
		protected readonly tableMap: TableMap
	) {
		this.outputExpressions = this.processQuerySelector(querySelector); // must occur before rectifying
		// TODO: clone queryAst and tableMap so that we don't mutate the original values here.
		if (queryAst.type === 'selectCommandNode') {
			queryAst.outputExpressions = this.outputExpressions;
			this.rectifyTableReferences(queryAst, tableMap);
		} else if (queryAst.type === 'insertCommandNode') {
			if (this.outputExpressions.length > 0) {
				queryAst.returning = this.outputExpressions;
			}
			if (queryAst.query?.query) {
				this.rectifyTableReferences(queryAst.query.query, tableMap);
			}
		} else if (queryAst.type === 'updateCommandNode') {
			if (this.outputExpressions.length > 0) {
				queryAst.returning = this.outputExpressions;
			}
		} else if (queryAst.type === 'deleteCommandNode') {
			this.rectifyTableReferences(queryAst, tableMap);
		}
		const walker = new SqlAstWalker(queryAst, tableMap);
		const data = walker.toSql();
		this.sql = data.sql;
		this.paramGetters = data.parameterGetters;
	}

	protected processQuerySelector(querySelector: QuerySelector): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(querySelector);
		return processor.process();
	}

	protected rectifyTableReferences(queryAst: SelectCommandNode | DeleteCommandNode, tableMap: TableMap) {
		const rectifier = new RectifyingWalker(queryAst, tableMap);
		rectifier.rectify();
	}
}

export class FinalisedQueryNoParams<TQuerySelector extends QuerySelector> extends FinalisedQuery<TQuerySelector> {
	public toSql(): GeneratedQuery {
		return {
			sql: this.sql,
			parameters: []
		};
	}

	public execute(queryable: Queryable) {
		return execute(queryable, this.sql, [], this.querySelector, this.outputExpressions);
	}
}

export class FinalisedQueryWithParams<TQuerySelector extends QuerySelector, TParams> extends FinalisedQuery<TQuerySelector> {
	constructor(
		querySelector: TQuerySelector,
		queryAst: AnyCommandNode,
		tableMap: TableMap,
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams> // just used for inferring TParams
	) {
		super(querySelector, queryAst, tableMap);
	}

	public toSql(params: TParams): GeneratedQuery {
		return {
			sql: this.sql,
			parameters: this.mapParameters(params)
		};
	}

	public execute(queryable: Queryable, params: TParams) {
		return execute(queryable, this.sql, this.mapParameters(params), this.querySelector, this.outputExpressions);
	}

	protected mapParameters(params: TParams) {
		return this.paramGetters.map((getter) => getter(params));
	}
}

export class FinalisedQueryNonReturningWithParams<TParams> extends FinalisedQuery<{}> {
	constructor(
		queryAst: AnyCommandNode,
		tableMap: TableMap,
		paramsProxy: ParamsProxy<TParams> | ParamsWrapper<TParams> // just used for inferring TParams
	) {
		super({}, queryAst, tableMap);
	}

	public toSql(params: TParams): GeneratedQuery {
		return {
			sql: this.sql,
			parameters: this.mapParameters(params)
		};
	}

	public execute(queryable: Queryable, params: TParams) {
		return executeNonReturning(queryable, this.sql, this.mapParameters(params));
	}

	protected mapParameters(params: TParams) {
		return this.paramGetters.map((getter) => getter(params));
	}

	protected processQuerySelector(querySelector: QuerySelector): Array<SelectOutputExpression> {
		return [];
	}
}

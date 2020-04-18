import { execute, executeNonReturning, Queryable } from "../execution";
import { QuerySelector } from "./querySelector";
import { AnyCommandNode, SelectCommandNode, SelectOutputExpression } from "./ast";
import { RectifyingWalker } from "./walkers/rectifyingWalker";
import { DefaultMap } from "../lang";
import { SqlAstWalker } from "./walkers/sqlAstWalker";
import { QuerySelectorProcessor } from "./metadata";
import { ParamsProxy } from "./params";

export interface GeneratedQuery {
	sql: string;
	parameters: unknown[];
}

export class PreparedQueryNonReturning<TParams> {
	constructor(
		protected readonly sql: string,
		protected readonly paramGetters: Array<(params: TParams) => unknown>) {

	}

	generate(params: TParams): GeneratedQuery {
		const values = this.paramGetters.map((getter) => getter(params));
		return {
			sql: this.sql,
			parameters: values
		};
	}

	execute(queryable: Queryable, params: TParams): Promise<void> {
		return executeNonReturning(queryable, this.generate(params));
	}
}

export abstract class FinalisedQuery<TQuerySelector extends QuerySelector> {
	protected readonly outputExpressions: SelectOutputExpression[];
	protected readonly sql: string;
	protected readonly paramGetters: Array<(params: unknown) => unknown>;

	constructor(
		protected readonly querySelector: TQuerySelector,
		protected readonly queryAst: AnyCommandNode,
		protected readonly tableMap: DefaultMap<string, string>
	) {
		this.outputExpressions = this.processQuerySelector(querySelector); // must occur before rectifying
		// TODO: clone queryAst and tableMap so that we don't mutate the original values here.
		if (queryAst.type === 'selectCommandNode') {
			queryAst.outputExpressions = this.outputExpressions;
			this.rectifyTableReferences(queryAst, tableMap);
		} else if (queryAst.type === 'insertCommandNode') {
			queryAst.returning = this.outputExpressions;
			if (queryAst.query?.query) {
				this.rectifyTableReferences(queryAst.query.query, tableMap);
			}
		} else if (queryAst.type === 'updateCommandNode') {
			queryAst.returning = this.outputExpressions;
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

	protected rectifyTableReferences(queryAst: SelectCommandNode, tableMap: DefaultMap<string, string>) {
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
		tableMap: DefaultMap<string, string>,
		paramsProxy: ParamsProxy<TParams> // just used for inferring TParams
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

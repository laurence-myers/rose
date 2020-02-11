import { execute, executeNonReturning, Queryable } from "../execution/execution";
import { QuerySelector } from "./querySelector";
import { SelectOutputExpression } from "./ast";
import { MappedQuerySelector } from "./typeMapping";

export interface GeneratedQuery {
	sql: string;
	parameters: any[];
}

export class PreparedQueryNonReturning<TParams> {
	constructor(
		protected readonly sql: string,
		protected readonly paramGetters: Array<(params: TParams) => any>) {

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

export class PreparedQuery<TQuerySelector extends QuerySelector, TParams> {
	constructor(
		protected readonly querySelector: TQuerySelector,
		protected readonly selectOutputExpressions: SelectOutputExpression[],
		protected readonly sql: string,
		protected readonly paramGetters: Array<(params: TParams) => any>) {

	}

	generate(params: TParams): GeneratedQuery {
		const values = this.paramGetters.map((getter) => getter(params));
		return {
			sql: this.sql,
			parameters: values
		};
	}

	execute(queryable: Queryable, params: TParams): Promise<MappedQuerySelector<TQuerySelector>[]> {
		return execute<TQuerySelector>(queryable, this.generate(params), this.querySelector, this.selectOutputExpressions);
	}
}

import { WithNode } from "../ast";
import { Clone, rectifyVariadicArgs } from "../../lang";
import { SelectQueryBuilder } from "./select";

export class CommonTableExpressionBuilder {
	protected readonly ast: WithNode;

	constructor(
		name: string,
		query: WithNode["query"] | SelectQueryBuilder<any>
	) {
		this.ast = {
			type: "withNode",
			name,
			query: query instanceof SelectQueryBuilder ? query.toNode() : query,
		};
	}

	get name() {
		return this.ast.name;
	}

	columnNames(columnNames: readonly string[]): this;
	columnNames(first: string, ...rest: readonly string[]): this;
	@Clone()
	columnNames(
		first: readonly string[] | string,
		...rest: readonly string[]
	): this {
		this.ast.columnNames = rectifyVariadicArgs(first, rest);
		return this;
	}

	materialized(isMaterialized: boolean = true) {
		this.ast.materialized = isMaterialized;
	}

	recursive(isRecursive: boolean = true) {
		this.ast.recursive = isRecursive;
	}

	// select(
	// 	callback: (
	// 		cteMetamodel: AliasedSubQueryMetamodel<TQuerySelector>
	// 	) => SelectQueryBuilder<TQuerySelector>
	// ): SelectQueryBuilder<TQuerySelector> {
	// 	return callback(this.toMetamodel()).with(this.toNode());
	// }

	toNode(): WithNode {
		return this.ast;
	}
}

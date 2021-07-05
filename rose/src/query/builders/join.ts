import { ColumnMetamodel, QueryTable } from "../metamodel";
import { FromItemNode, JoinNode, SimpleColumnReferenceNode } from "../ast";
import { TableMap } from "../../data";
import { UnsupportedOperationError } from "../../errors";
import { rectifyVariadicArgs } from "../../lang";
import { AliasedSubQueryBuilder, CommonTableExpressionBuilder } from "./select";
import { QuerySelector } from "../querySelector";
import { aliasTable } from "../dsl";

/**
 * Something that can be joined:
 *
 * - A QueryTable instance
 * - An aliased subquery builder
 * - A common table expression builder
 */
export type Joinable<TQuerySelector extends QuerySelector> =
	| AliasedSubQueryBuilder<QuerySelector>
	| CommonTableExpressionBuilder<QuerySelector>
	| QueryTable;

export class InitialJoinBuilder<TQuerySelector extends QuerySelector> {
	constructor(protected readonly joinable: Joinable<TQuerySelector>) {}

	inner(): OnOrUsingJoinBuilder<TQuerySelector> {
		return new OnOrUsingJoinBuilder(this.joinable, "inner");
	}

	left(): OnOrUsingJoinBuilder<TQuerySelector> {
		return new OnOrUsingJoinBuilder(this.joinable, "left");
	}

	right(): OnOrUsingJoinBuilder<TQuerySelector> {
		return new OnOrUsingJoinBuilder(this.joinable, "right");
	}

	full(): OnOrUsingJoinBuilder<TQuerySelector> {
		return new OnOrUsingJoinBuilder(this.joinable, "full");
	}

	cross() {
		return new BuildableJoin(this.joinable, "cross");
	}
}

export class OnOrUsingJoinBuilder<TQuerySelector extends QuerySelector> {
	constructor(
		protected readonly joinable: Joinable<TQuerySelector>,
		protected readonly joinType: "inner" | "left" | "right" | "full"
	) {}

	on(expression: JoinNode["on"]) {
		return new BuildableJoin(this.joinable, this.joinType, expression);
	}

	using(
		column: ColumnMetamodel<any> | readonly ColumnMetamodel<any>[],
		...columns: readonly ColumnMetamodel<any>[]
	) {
		const usingNodes = rectifyVariadicArgs(column, columns).map(
			(columnToMap): SimpleColumnReferenceNode => ({
				type: "simpleColumnReferenceNode",
				columnName: columnToMap.name,
			})
		);
		return new BuildableJoin(
			this.joinable,
			this.joinType,
			undefined,
			usingNodes
		);
	}
}

export class BuildableJoin<TQuerySelector extends QuerySelector> {
	constructor(
		protected readonly joinable: Joinable<TQuerySelector>,
		protected readonly joinType: JoinNode["joinType"],
		protected readonly onNode?: JoinNode["on"],
		protected readonly usingNodes?: JoinNode["using"]
	) {}

	build(tableMap: TableMap) {
		if (this.onNode && this.usingNodes) {
			throw new UnsupportedOperationError(
				`Cannot join tables with both "on" and "using" criteria.`
			);
		} else if (this.joinType == "cross" && (this.onNode || this.usingNodes)) {
			throw new UnsupportedOperationError(
				`Cannot make a cross join with "on" or "using" criteria.`
			);
		}
		let fromItem: FromItemNode;
		if (this.joinable instanceof QueryTable) {
			const tableName = this.joinable.$table.name;
			const tableAlias = tableMap.get(tableName);
			fromItem = aliasTable(tableName, tableAlias);
		} else if (this.joinable instanceof CommonTableExpressionBuilder) {
			const tableName = this.joinable.alias;
			tableMap.set(this.joinable.alias, this.joinable.alias);
			fromItem = {
				type: "tableReferenceNode",
				tableName,
			};
		} else {
			tableMap.set(this.joinable.alias, this.joinable.alias);
			fromItem = this.joinable.toNode();
		}
		const joinNode: JoinNode = {
			type: "joinNode",
			joinType: this.joinType,
			fromItem: fromItem,
			on: this.onNode,
			using: this.usingNodes,
		};
		return joinNode;
	}
}

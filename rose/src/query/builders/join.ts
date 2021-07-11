import { ColumnMetamodel } from "../metamodel";
import {
	FromItemJoinNode,
	FromItemNode,
	SimpleColumnReferenceNode,
} from "../ast";
import { UnsupportedOperationError } from "../../errors";
import { rectifyVariadicArgs } from "../../lang";
import { BaseFromBuilder, Fromable } from "./from";
import { from } from "../dsl";

/**
 * Something that can be joined:
 *
 * - A QueryTable instance
 * - An aliased subquery builder
 * - A common table expression builder
 */
// export type Joinable<TQuerySelector extends QuerySelector> =
// 	| AliasedSubQueryBuilder<TQuerySelector>
// 	| CommonTableExpressionBuilder<TQuerySelector>
// 	| QueryTable;

export type Joinable = Fromable | BuildableJoin;

export class InitialJoinBuilder {
	protected readonly leftFrom: FromItemNode;
	protected readonly rightFrom: FromItemNode;

	constructor(leftFrom: Joinable, rightFrom: Joinable) {
		this.leftFrom = this.rectifyJoinable(leftFrom);
		this.rightFrom = this.rectifyJoinable(rightFrom);
	}

	protected rectifyJoinable(joinable: Joinable): FromItemNode {
		let fromNode;
		if (joinable instanceof BuildableJoin) {
			fromNode = joinable.build();
		} else {
			const leftNodeOrBuilder = from(joinable);
			if (leftNodeOrBuilder instanceof BaseFromBuilder) {
				fromNode = leftNodeOrBuilder.toNode();
			} else {
				fromNode = leftNodeOrBuilder;
			}
		}
		return fromNode;
	}

	inner(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.leftFrom, this.rightFrom, "inner");
	}

	left(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.leftFrom, this.rightFrom, "left");
	}

	right(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.leftFrom, this.rightFrom, "right");
	}

	full(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.leftFrom, this.rightFrom, "full");
	}

	cross() {
		return new BuildableJoin(this.leftFrom, this.rightFrom, "cross");
	}
}

export class OnOrUsingJoinBuilder {
	constructor(
		protected readonly leftFrom: FromItemNode,
		protected readonly rightFrom: FromItemNode,
		protected readonly joinType: "inner" | "left" | "right" | "full"
	) {}

	natural() {
		return new BuildableJoin(
			this.leftFrom,
			this.rightFrom,
			this.joinType,
			undefined,
			undefined,
			true
		);
	}

	on(expression: FromItemJoinNode["on"]) {
		return new BuildableJoin(
			this.leftFrom,
			this.rightFrom,
			this.joinType,
			expression
		);
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
			this.leftFrom,
			this.rightFrom,
			this.joinType,
			undefined,
			usingNodes
		);
	}
}

export class BuildableJoin {
	constructor(
		protected readonly leftFrom: FromItemNode,
		protected readonly rightFrom: FromItemNode,
		protected readonly joinType: FromItemJoinNode["joinType"],
		protected readonly onNode?: FromItemJoinNode["on"],
		protected readonly usingNodes?: FromItemJoinNode["using"],
		protected readonly natural?: FromItemJoinNode["natural"]
	) {}

	build(): FromItemJoinNode {
		if (
			(this.natural && (this.onNode || this.usingNodes)) ||
			(this.onNode && this.usingNodes)
		) {
			throw new UnsupportedOperationError(
				`Tables can only be joined with one of "on", "using" or "natural" criteria, not a combination.`
			);
		} else if (
			this.joinType == "cross" &&
			(this.onNode || this.usingNodes || this.natural)
		) {
			throw new UnsupportedOperationError(
				`Cannot make a cross join with "on", "using" or "natural" criteria.`
			);
		}
		const joinNode: FromItemJoinNode = {
			type: "fromItemJoinNode",
			joinType: this.joinType,
			leftFromItem: this.leftFrom,
			rightFromItem: this.rightFrom,
			natural: this.natural,
			on: this.onNode,
			using: this.usingNodes,
		};
		return joinNode;
	}

	join(other: Joinable) {
		return new InitialJoinBuilder(this.build(), other);
	}

	fullJoin(other: Joinable) {
		return this.join(other).full();
	}

	innerJoin(other: Joinable) {
		return this.join(other).inner();
	}

	leftJoin(other: Joinable) {
		return this.join(other).left();
	}

	rightJoin(other: Joinable) {
		return this.join(other).right();
	}

	crossJoin(other: Joinable) {
		return this.join(other).cross();
	}
}

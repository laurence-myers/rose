import { ColumnMetamodel, QueryTable } from "../metamodel";
import { JoinNode, SimpleColumnReferenceNode } from "../ast";
import { TableMap } from "../../data";
import { UnsupportedOperationError } from "../../errors";

export class InitialJoinBuilder {
	constructor(
		protected readonly qtable: QueryTable
	) {}

	inner(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.qtable, 'inner');
	}

	left(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.qtable, 'left');
	}

	right(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.qtable, 'right');
	}

	full(): OnOrUsingJoinBuilder {
		return new OnOrUsingJoinBuilder(this.qtable, 'full');
	}

	cross() {
		return new BuildableJoin(this.qtable, 'cross');
	}
}

export class OnOrUsingJoinBuilder {
	constructor(
		protected readonly qtable: QueryTable,
		protected readonly joinType: 'inner' | 'left' | 'right' | 'full'
	) {}

	on(expression: JoinNode['on']) {
		return new BuildableJoin(
			this.qtable,
			this.joinType,
			expression
		);
	}

	using(column: ColumnMetamodel<any>, ...columns: ColumnMetamodel<any>[]) {
		const usingNodes = [column].concat(columns).map((columnToMap): SimpleColumnReferenceNode => ({
			type: "simpleColumnReferenceNode",
			columnName: columnToMap.name
		}));
		return new BuildableJoin(
			this.qtable,
			this.joinType,
			undefined,
			usingNodes
		);
	}
}

export class BuildableJoin {
	constructor(
		protected readonly qtable: QueryTable,
		protected readonly joinType: JoinNode['joinType'],
		protected readonly onNode?: JoinNode['on'],
		protected readonly usingNodes?: JoinNode['using']
	) {
	}

	build(tableMap: TableMap) {
		if (this.onNode && this.usingNodes) {
			throw new UnsupportedOperationError(`Cannot join tables with both "on" and "using" criteria.`);
		} else if (this.joinType == 'cross' && (this.onNode || this.usingNodes)) {
			throw new UnsupportedOperationError(`Cannot make a cross join with "on" or "using" criteria.`);
		}
		const tableName = this.qtable.$table.name;
		const alias = tableMap.get(tableName);
		const joinNode: JoinNode = {
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
		return joinNode;
	}
}

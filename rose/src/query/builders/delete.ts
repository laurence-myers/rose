import { Clone } from "../../lang";
import { AliasedExpressionNode, BooleanExpression, DeleteCommandNode, TableReferenceNode } from "../ast";
import { QueryTable } from "../metamodel";
import { FinalisedQueryNonReturningWithParams } from "../finalisedQuery";
import { aliasTable } from "../dsl/core";
import { TableMap } from "../../data";
import { ParamsProxy, ParamsWrapper } from "../params";

export class DeleteQueryBuilder<TParams> {
	protected tableMap = new TableMap();
	protected queryAst: DeleteCommandNode;

	constructor(
		qtable: QueryTable
	) {
		this.queryAst = {
			type: 'deleteCommandNode',
			from: this.from(qtable),
			conditions: [],
		};
	}

	protected from(qtable: QueryTable): AliasedExpressionNode<TableReferenceNode> {
		const tableName = qtable.$table.name;
		const alias = qtable.$table.alias || this.tableMap.get(tableName);
		return aliasTable(tableName, alias);
	}

	@Clone()
	where(whereExpression: BooleanExpression): this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	finalise<TParams>(params: ParamsProxy<TParams> | ParamsWrapper<TParams>): FinalisedQueryNonReturningWithParams<TParams> {
		return new FinalisedQueryNonReturningWithParams<TParams>(
			this.queryAst,
			this.tableMap,
			params
		);
	}
}

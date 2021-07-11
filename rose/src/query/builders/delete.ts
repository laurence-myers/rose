import { Clone } from "../../lang";
import { BooleanExpression, DeleteCommandNode } from "../ast";
import { QueryTable } from "../metamodel";
import { FinalisedQueryNonReturningWithParams } from "../finalisedQuery";
import { from } from "../dsl";
import { TableMap } from "../../data";
import { ParamsProxy, ParamsWrapper } from "../params";

export class DeleteQueryBuilder<TParams> {
	protected tableMap = new TableMap();
	protected queryAst: DeleteCommandNode;

	constructor(qtable: QueryTable) {
		this.queryAst = {
			type: "deleteCommandNode",
			from: from(qtable).toNode(),
			conditions: [],
		};
	}

	@Clone()
	where(whereExpression: BooleanExpression): this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	finalise<TParams>(
		params: ParamsProxy<TParams> | ParamsWrapper<TParams>
	): FinalisedQueryNonReturningWithParams<TParams> {
		return new FinalisedQueryNonReturningWithParams<TParams>(
			this.queryAst,
			this.tableMap,
			params
		);
	}
}

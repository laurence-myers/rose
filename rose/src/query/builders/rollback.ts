import { RollbackCommandNode } from "../ast";
import { Clone, coerceNullToUndefined } from "../../lang";
import { FinalisedQueryNonReturningWithParams } from "../finalisedQuery";
import { TableMap } from "../../data";

export class RollbackCommandBuilder {
	protected readonly queryAst: RollbackCommandNode;

	constructor() {
		this.queryAst = {
			type: "rollbackCommandNode",
		};
	}

	@Clone()
	andChain(chain: boolean | null = true): this {
		this.queryAst.chain = coerceNullToUndefined(chain);
		return this;
	}

	finalise(): FinalisedQueryNonReturningWithParams<{}> {
		return new FinalisedQueryNonReturningWithParams<{}>(
			this.queryAst,
			new TableMap(),
			{}
		);
	}
}

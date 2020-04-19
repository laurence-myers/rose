import { CommitCommandNode } from "../ast";
import { Clone, coerceNullToUndefined } from "../../lang";
import { FinalisedQueryNonReturningWithParams } from "../finalisedQuery";
import { TableMap } from "../../data";

export class CommitCommandBuilder {
	protected readonly queryAst: CommitCommandNode;

	constructor() {
		this.queryAst = {
			type: "commitCommandNode",
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

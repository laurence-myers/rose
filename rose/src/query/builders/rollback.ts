import { RollbackCommandNode } from "../ast";
import { Clone, coerceNullToUndefined } from "../../lang";
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { SqlAstWalker } from "../walkers/sqlAstWalker";
import { Queryable } from "../../execution";

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

	prepare(): PreparedQueryNonReturning<{}> {
		const walker = new SqlAstWalker(this.queryAst);
		const data = walker.toSql();
		return new PreparedQueryNonReturning<{}>(data.sql, data.parameterGetters);
	}

	toSql(): GeneratedQuery {
		return this.prepare()
			.generate({});
	}

	execute(queryable: Queryable): Promise<void> {
		return this.prepare()
			.execute(queryable, {});
	}
}

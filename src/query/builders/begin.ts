import { BeginCommandNode, TransactionModeNode } from "../ast";
import { Clone, coerceNullToUndefined } from "../../lang";
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { SqlAstWalker } from "../walkers/sqlAstWalker";
import { Queryable } from "../../execution/execution";

export enum TransactionIsolationLevel {
	Serializable = 'SERIALIZABLE',
	RepeatableRead = 'REPEATABLE READ',
	ReadCommitted = 'READ COMMITTED',
	ReadUncommitted = 'READ UNCOMMITTED'
}

export enum TransactionReadMode {
	ReadWrite = 'WRITE',
	ReadOnly = 'ONLY'
}

export class BeginCommandBuilder {
	protected readonly queryAst: BeginCommandNode;

	constructor() {
		this.queryAst = {
			type: "beginCommandNode",
		};
	}

	protected createTransactionModeNode(): TransactionModeNode {
		return {
			type: "transactionModeNode"
		};
	}

	@Clone()
	isolationLevel(isolationLevel: TransactionIsolationLevel | null): this {
		if (!this.queryAst.transactionMode) {
			this.queryAst.transactionMode = this.createTransactionModeNode();
		}
		this.queryAst.transactionMode.isolationLevel = coerceNullToUndefined(isolationLevel);
		return this;
	}

	@Clone()
	readMode(readMode: TransactionReadMode | null): this {
		if (!this.queryAst.transactionMode) {
			this.queryAst.transactionMode = this.createTransactionModeNode();
		}
		this.queryAst.transactionMode.readMode = coerceNullToUndefined(readMode);
		return this;
	}

	@Clone()
	deferrable(isDeferrable: boolean | null = true): this {
		if (!this.queryAst.transactionMode) {
			this.queryAst.transactionMode = this.createTransactionModeNode();
		}
		this.queryAst.transactionMode.deferrable = coerceNullToUndefined(isDeferrable);
		return this;
	}

	prepare(): PreparedQueryNonReturning<{}> {
		const walker = new SqlAstWalker(this.queryAst);
		const data = walker.prepare();
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

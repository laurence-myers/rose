import { TransactionIsolationLevel, TransactionReadMode } from "../builders/begin";
import { begin, commit, rollback } from "./commands";
import { Queryable } from "../../execution/execution";
import { PreparedQueryNonReturning } from "../preparedQuery";

export interface TransactionOptions {
	isolationLevel?: TransactionIsolationLevel;
	readMode?: TransactionReadMode;
	deferrable?: boolean;
	andChain?: boolean;
}

export class Transaction {
	public finished: boolean = false;
	protected readonly beginQuery: PreparedQueryNonReturning<{}>;
	protected readonly commitQuery: PreparedQueryNonReturning<{}>;
	protected readonly rollbackQuery: PreparedQueryNonReturning<{}>;

	constructor(
		protected readonly client: Queryable,
		options: TransactionOptions
	) {
		let beginQuery = begin(); // TODO: is there any point having a fluent interface if it's easier to pass an options object?
		if (options.isolationLevel) {
			beginQuery = beginQuery.isolationLevel(options.isolationLevel);
		}
		if (options.readMode) {
			beginQuery = beginQuery.readMode(options.readMode);
		}
		if (options.deferrable !== undefined) {
			beginQuery = beginQuery.deferrable(options.deferrable);
		}
		this.beginQuery = beginQuery.prepare();
		this.commitQuery = commit()
			.andChain(options.andChain === undefined ? null : options.andChain)
			.prepare();
		this.rollbackQuery = rollback()
			.andChain(options.andChain === undefined ? null : options.andChain)
			.prepare();
	}

	begin() {
		return this.beginQuery.execute(this.client, {});
	}

	async commit() {
		if (!this.finished) {
			await this.commitQuery.execute(this.client, {});
			this.finished = true;
		}
	}

	async rollback() {
		if (!this.finished) {
			await this.rollbackQuery.execute(this.client, {});
			this.finished = true;
		}
	}
}

export async function transaction<T>(
	client: Queryable,
	callback: (t: Transaction) => Promise<T>,
	options: TransactionOptions = {}
): Promise<T> {
	const trans = new Transaction(
		client,
		options
	);
	try {
		await trans.begin();
		const result = await callback(trans);
		await trans.commit();
		return result;
	} catch (err) {
		try {
			await trans.rollback();
		} catch (err2) {
			console.error(`Failed to rollback transaction: ${ err2 }`);
		}
		throw err;
	}
}

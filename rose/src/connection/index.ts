import { Queryable, QueryResult } from "../execution";
import { transaction, Transaction } from "../query/dsl";

interface Disposable {
	dispose(): void;
}

export interface PoolClient extends Queryable {
	release(err?: Error | boolean): void;
}

export interface Pool {
	connect(): Promise<PoolClient>;
}

/**
 * This class intercepts calls to `query()` and calls the logger function you provide.
 *
 * To use it, you can override the `AbstractDatabaseContext` constructor, an wrap the given client.
 *
 * E.g.
 *
 * ```
 * * class DatabaseContext extends AbstractDatabaseContext {
 *     constructor(client: PoolClient) {
 *         super(new LoggingClient((query, values) => console.log({ query, values }), client);
 *     }
 * }
 * ```
 */
export class LoggingClient implements PoolClient {
	constructor(
		protected readonly logger: (queryText: string, values: unknown[]) => void,
		protected readonly client: PoolClient
	) {}

	query(queryText: string, values: any[]): Promise<QueryResult> {
		this.logger(queryText, values);
		return this.client.query(queryText, values);
	}

	release(err?: Error | boolean): void {
		return this.client.release(err);
	}
}

/**
 * Inherit from this class, adding a property for each of your repositories.
 *
 * E.g.
 *
 * ```
 * class DatabaseContext extends AbstractDatabaseContext {
 *     public readonly customerRepository = new CustomerRepository(this.client);
 * }
 * ```
 *
 */
export abstract class AbstractDatabaseContext implements Disposable {
	constructor(protected readonly _client: PoolClient) {}

	public get client(): Queryable {
		return this._client;
	}

	public dispose(): void {
		this._client.release();
	}

	public inTransaction<TReturn>(
		cb: (db: this, transaction: Transaction) => Promise<TReturn>
	): Promise<TReturn> {
		return transaction(this._client, (transaction) => cb(this, transaction));
	}
}

/**
 * Inherit from this class, implementing `pool()` to get a connection pool. This should be a singleton; how you
 * initialise it is up to you.
 *
 * E.g.
 *
 * ```
 * class ConnectionManager extends AbstractConnectionManager<DatabaseContext> {
 *     protected _pool: Pool | undefined;
 *
 *     constructor(protected readonly databaseUrl: string) {
 *         super();
 *     }
 *
 *     get pool() {
 *         if (!this._pool) {
 *             this._pool = new Pool({
 *                 connectionString: this.databaseUrl,
 *                  max: 10,
 *                  idleTimeoutMillis: 30000,
 *                  connectionTimeoutMillis: 2000,
 *             });
 *         }
 *         return this._pool;
 *     }
 * }
 * ```
 */
export abstract class AbstractConnectionManager<
	TContext extends AbstractDatabaseContext
> {
	constructor() {}

	protected abstract get pool(): Pool;

	protected abstract createDatabaseContext(poolClient: PoolClient): TContext;

	protected async getConnection(): Promise<TContext> {
		const poolClient: PoolClient = await this.pool.connect();
		return this.createDatabaseContext(poolClient);
	}

	/**
	 * Acquire a connection, execute a callback that accepts a "database context", and release the connection when done.
	 */
	public async withConnection<TReturn>(
		cb: (db: TContext) => Promise<TReturn>
	): Promise<TReturn> {
		let db;
		try {
			db = await this.getConnection();
			const result = await cb(db);
			return result;
		} finally {
			if (db) {
				db.dispose();
			}
		}
	}

	/**
	 * Acquire a connection, begin a transaction, execute a callback, commit/rollback the transaction, then release the
	 * connection.
	 */
	public async inTransaction<TReturn>(
		cb: (db: TContext, transaction: Transaction) => Promise<TReturn>
	): Promise<TReturn> {
		let db;
		try {
			db = await this.getConnection();
			const result = await db.inTransaction(cb);
			return result;
		} finally {
			if (db) {
				db.dispose();
			}
		}
	}
}

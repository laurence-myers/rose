import { Queryable } from "../execution";
import { transaction, Transaction } from "../query/dsl";

interface Disposable {
    dispose(): void;
}

interface PoolClient extends Queryable {
    release(err?: Error | boolean): void;
}

interface Pool {
    connect(): Promise<PoolClient>
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

    public inTransaction<TReturn>(cb: (db: this, transaction: Transaction) => Promise<TReturn>): Promise<TReturn> {
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
export abstract class AbstractConnectionManager<TContext extends AbstractDatabaseContext> {

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
    public async withConnection<TReturn>(cb: (db: TContext) => Promise<TReturn>): Promise<TReturn> {
        let db;
        try {
            db = await this.getConnection();
            return cb(db);
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
    public async inTransaction<TReturn>(cb: (db: TContext, transaction: Transaction) => Promise<TReturn>): Promise<TReturn> {
        let db;
        try {
            db = await this.getConnection();
            return db.inTransaction(cb);
        } finally {
            if (db) {
                db.dispose();
            }
        }
    }
}

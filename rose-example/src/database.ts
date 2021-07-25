import {
  AbstractConnectionManager,
  AbstractDatabaseContext,
} from "@rosepg/rose";
import { Pool, PoolClient } from "pg";
import { FilmRepository } from "./repositories/filmRepository";
import { LanguageRepository } from "./repositories/languageRepository";

export class DatabaseContext extends AbstractDatabaseContext {
  public readonly filmRepository = new FilmRepository(this.client);
  public readonly languageRepository = new LanguageRepository(this.client);
}

export class ConnectionManager extends AbstractConnectionManager<DatabaseContext> {
  protected _pool: Pool | undefined;

  constructor(protected readonly databaseUrl: string) {
    super();
  }

  public createDatabaseContext(poolClient: PoolClient): DatabaseContext {
    return new DatabaseContext(poolClient);
  }

  protected get pool(): Pool {
    if (!this._pool) {
      this._pool = new Pool({
        connectionString: this.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    return this._pool;
  }

  public async dispose(): Promise<void> {
    return this._pool?.end();
  }
}

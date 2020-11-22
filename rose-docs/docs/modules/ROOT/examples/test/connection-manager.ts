import {
	AbstractConnectionManager,
	AbstractDatabaseContext,
	matchesRegexp,
	Queryable,
	select,
	withParams
} from '@rosepg/rose';
import { FilmAllColumns, QFilm } from "../generated/db/Film";
import { Pool, PoolClient } from 'pg';

describe(`Connection Manager`, () => {
	it(`can implement concrete classes`, async () => {
		// tag::example1[]
		// This is some sort of repository that provides an interface to your database.
		// The exact implementation is not important for this example.
		class FilmRepository {
			protected static getFilmsByTitleQuery = withParams<{ name: string }>()((p) =>
				select(FilmAllColumns)
					.where(
						matchesRegexp(QFilm.title.col(), p.name)
					)
					.finalise(p)
			)

			constructor(
				protected readonly client: Queryable
			) {}

			public getFilmsByName() {
				return FilmRepository.getFilmsByTitleQuery.execute(this.client, {
					name: 'red'
				});
			}
		}

		// This database context provides access to an instance of FilmRepository, only once a connection is acquired.
		class DatabaseContext extends AbstractDatabaseContext {
			public readonly filmRepository = new FilmRepository(this.client);
		}

		// The ConnectionManager creates an instance of DatabaseContext, and creates/destroys the connection pool.
		class ConnectionManager extends AbstractConnectionManager<DatabaseContext> {
			constructor(protected readonly databaseUrl: string) {
				super();
			}

			protected _pool: Pool | undefined;

			protected get pool(): Pool {
				if (!this._pool) {
					this._pool = new Pool({
						connectionString: this.databaseUrl,
						max: 20,
						idleTimeoutMillis: 30000,
						connectionTimeoutMillis: 2000,
					});
				}
				return this._pool;
			}

			public createDatabaseContext(poolClient: PoolClient): DatabaseContext {
				return new DatabaseContext(poolClient);
			}

			public async dispose(): Promise<void> {
				return this._pool?.end();
			}
		}

		// end::example1[]
	});
});

import * as assert from 'assert';
import { AbstractDatabaseContext, LoggingClient, PoolClient } from "../../src/connection";
import { QueryResult } from "../../src/execution";

describe(LoggingClient.name, () => {
	it(`Can be used in a DatabaseContext to log queries`, async () => {
		// Setup
		const loggedQueries: {
			query: string;
			values: ReadonlyArray<unknown>;
		}[] = [];
		function fakeLogger(query: string, values: ReadonlyArray<unknown>) {
			loggedQueries.push({
				query,
				values
			});
		}
		class DatabaseContext extends AbstractDatabaseContext {
			constructor(client: PoolClient) {
				super(new LoggingClient(fakeLogger, client));
			}
		}
		const expectedError = new Error(`Not implemented`);
		const dummyPoolClient: PoolClient = {
			release() {
			},
			async query(): Promise<QueryResult> {
				throw expectedError;
			}
		};
		const querySql = `SELECT * FROM foo WHERE id = $1`;
		const queryValues = ['1234'];

		const databaseContext = new DatabaseContext(dummyPoolClient);

		try {
			// Execute
			await databaseContext.client.query(`SELECT * FROM foo WHERE id = $1`, ['1234']);
			assert.fail(`Query should throw an error`);
		} catch (err) {
			assert.deepStrictEqual(err, expectedError);
		}

		// Verify
		assert.deepStrictEqual(loggedQueries, [
			{
				query: querySql,
				values: queryValues
			}
		]);
	});
});

import { transaction } from "../../../src/query/dsl/transaction";
import { Queryable, QueryResult } from "../../../src/execution";
import * as assert from "assert";

describe(`Transactions`, () => {
	describe(`transaction()`, () => {
		it(`should begin and commit`, async () => {
			// Set up
			const sqlExecuted: string[] = [];

			const client: Queryable = {
				async query(queryText: string, _values: any[]): Promise<QueryResult> {
					sqlExecuted.push(queryText);
					return {
						command: ``,
						oid: 1,
						rowCount: 0,
						rows: [],
						fields: [],
					};
				},
			};

			const callback = async () => {};

			// Execute
			await transaction(client, callback);

			// Verify
			assert.deepEqual(sqlExecuted, [`BEGIN`, `COMMIT`]);
		});

		it(`should begin and rollback when an unhandled error is encountered`, async () => {
			// Set up
			const sqlExecuted: string[] = [];

			const client: Queryable = {
				async query(queryText: string, _values: any[]): Promise<QueryResult> {
					sqlExecuted.push(queryText);
					return {
						command: ``,
						oid: 1,
						rowCount: 0,
						rows: [],
						fields: [],
					};
				},
			};

			const expectedError = new Error(`Expected test error`);

			const callback = async () => {
				throw expectedError;
			};

			// Execute
			try {
				await transaction(client, callback);
			} catch (err) {
				assert.strictEqual(err, expectedError);
			}

			// Verify
			assert.deepEqual(sqlExecuted, [`BEGIN`, `ROLLBACK`]);
		});
	});
});

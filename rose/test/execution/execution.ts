import assert = require("assert");
import { QUsers } from "../fixtures";
import { select } from "../../src/query/dsl/commands";
import { Queryable, QueryResult } from "../../src/execution";

class MockQueryable implements Queryable {
	constructor(protected readonly rows: unknown[]) {}

	query(queryText: string, values: unknown[]): Promise<QueryResult> {
		return Promise.resolve({
			command: "mockCommand",
			rowCount: this.rows.length,
			oid: 12345,
			rows: this.rows,
			fields: [],
		});
	}
}

describe("Execution", function () {
	it("Full execution path", async function () {
		const querySelect = {
			id: QUsers.id,
		};

		const rows = [
			{
				id: 123,
			},
		];
		const mockDb: Queryable = new MockQueryable(rows);
		const expectedMappedRow = {
			id: rows[0].id,
		};

		const result = await select(querySelect)
			.orderBy(QUsers.id.desc())
			.finalise({})
			.execute(mockDb, {});

		assert.deepEqual(result, [expectedMappedRow]);
	});
});

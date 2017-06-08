import assert = require('assert');
import {QUsers} from "./fixtures";
import {Column} from "../src/query/metamodel";
import {select} from "../src/query/dsl";
import {Queryable} from "../src/execution/execution";
import {QueryResult} from "pg";

class MockQueryable implements Queryable {
	constructor(protected readonly rows : any[]) {

	}

	query(queryText : string, values : any[]) : Promise<QueryResult> {
		return Promise.resolve({
			command: 'mockCommand',
			rowCount: this.rows.length,
			oid: 12345,
			rows: this.rows
		});
	}
}

describe("Execution", function () {
	it("Full execution path", async function () {
		class QuerySelect {
			@Column(QUsers.id)
			id : number;
		}

		const rows = [
			{
				id: 123
			}
		];
		const mockDb : Queryable = new MockQueryable(rows);
		const expectedMappedRow = new QuerySelect();
		expectedMappedRow.id = rows[0].id;

		const result = await select(QuerySelect)
			.orderBy(QUsers.id.desc())
			.execute(mockDb, {});

		assert.deepEqual(result, [
			expectedMappedRow
		]);
	});
});
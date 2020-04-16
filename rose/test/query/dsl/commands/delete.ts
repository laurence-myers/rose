import { QUsers } from "../../../fixtures";
import { deleteFrom } from "../../../../src/query/dsl/commands";
import { constant } from "../../../../src/query/dsl/core";
import assert = require('assert');

describe(`DELETE commands`, () => {
	it(`supports deleting from a table with constant criteria`, function () {
		// Set up
		const query = deleteFrom(QUsers)
			.where(QUsers.id.eq(constant(123)));

		// Execute
		const actual = query.toSql({});

		// Verify
		const expected = {
			sql: `DELETE FROM "Users" as "t1" WHERE "t1"."id" = $1`,
			parameters: [
				123
			]
		};
		assert.deepEqual(actual, expected);
	});

	xit(`supports returning a selection`, function () {});
});

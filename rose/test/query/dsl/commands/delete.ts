import { QLocations, QUsers } from "../../../fixtures";
import { deleteFrom } from "../../../../src/query/dsl/commands";
import { constant } from "../../../../src/query/dsl/core";
import assert = require("assert");
import { subSelect } from "../../../../src/query/dsl";

describe(`DELETE commands`, () => {
	it(`supports deleting from a table with constant criteria`, function () {
		// Set up
		const query = deleteFrom(QUsers).where(QUsers.id.eq(constant(123)));

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `DELETE FROM "Users" WHERE "Users"."id" = $1`,
			parameters: [123],
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports deleting from a table with a sub-select criteria`, function () {
		// Set up
		const query = deleteFrom(QUsers).where(
			QUsers.locationId.eq(
				subSelect(QLocations.id)
					.where(QLocations.agencyId.eq(constant(123)))
					.toNode()
			)
		);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `DELETE FROM "Users" WHERE "Users"."locationId" = (SELECT "Locations"."id" FROM "Locations" WHERE "Locations"."agencyId" = $1)`,
			parameters: [123],
		};
		assert.deepEqual(actual, expected);
	});

	xit(`supports returning a selection`, function () {});
});

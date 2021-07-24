import { QLocations, QUsers, QUsersSC, TUsers } from "../../../fixtures";
import { upper } from "../../../../src/query/dsl/postgresql/string/sql";
import { update, updateFromObject } from "../../../../src/query/dsl/commands";
import { constant } from "../../../../src/query/dsl/core";
import {
	PartialTableColumns,
	TableColumns,
} from "../../../../src/query/metamodel";
import { ParamsWrapper, withParams } from "../../../../src/query/params";
import assert = require("assert");
import { now } from "../../../../src/query/dsl/postgresql/dateTime";

describe(`UPDATE commands`, function () {
	it(`supports updating a table with simple values; updated columns should be sorted alphabetically; supports snake_case columns`, function () {
		// Set up
		interface Params {
			name: string;
		}
		const paramsWrapper = new ParamsWrapper<Params>();
		const query = update(QUsersSC)
			.set({
				name: upper(paramsWrapper.get((p) => p.name)),
				deletedAt: now(),
			})
			.where(QUsers.id.eq(constant(123)));

		// Execute
		const actual = query.finalise(paramsWrapper).toSql({
			name: "fred",
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" SET "deleted_at" = now(), "name" = upper($1) WHERE "Users"."id" = $2`,
			parameters: ["fred", 123],
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports dynamically generating "set" criteria from an entity-like object`, function () {
		// Set up
		interface Params {
			id: TableColumns<TUsers>["id"];
		}

		const now = new Date("2020-04-01T14:30:00Z");

		const updates: PartialTableColumns<TUsers> = {
			deletedAt: now,
			name: "fred",
		};
		const paramsWrapper = new ParamsWrapper<Params>();

		const query = updateFromObject(QUsers, updates).where(
			QUsers.id.eq(paramsWrapper.get((p) => p.id))
		);

		// Execute
		const actual = query.finalise(paramsWrapper).toSql({
			id: 123,
			...updates,
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" SET "deletedAt" = $1, "name" = $2 WHERE "Users"."id" = $3`,
			parameters: [now, "fred", 123],
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports updating from another table`, function () {
		const query = withParams()((p) =>
			update(QUsers)
				.set({
					deletedAt: now(),
				})
				.from(QLocations)
				.where(QUsers.locationId.eq(QLocations.id))
				.finalise(p)
		);

		// Execute
		const actual = query.toSql({});

		// Verify
		const expected = {
			sql: `UPDATE "Users" SET "deletedAt" = now() FROM "Locations" WHERE "Users"."locationId" = "Locations"."id"`,
			parameters: [],
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports returning updated rows`, function () {
		// Set up
		interface Params {
			id: TableColumns<TUsers>["id"];
		}

		const now = new Date("2020-04-01T14:30:00Z");

		const updates: PartialTableColumns<TUsers> = {
			deletedAt: now,
			name: "fred",
		};
		const paramsWrapper = new ParamsWrapper<Params>();

		const query = updateFromObject(QUsers, updates)
			.where(QUsers.id.eq(paramsWrapper.get((p) => p.id)))
			.returning({
				updatedId: QUsers.id,
				name: QUsers.name,
			});

		// Execute
		const actual = query.finalise({}).toSql({
			id: 123,
			...updates,
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" SET "deletedAt" = $1, "name" = $2 WHERE "Users"."id" = $3 RETURNING "Users"."id" as "updatedId", "Users"."name" as "name"`,
			parameters: [now, "fred", 123],
		};
		assert.deepEqual(actual, expected);
	});
});

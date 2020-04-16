import { QUsers, TUsers } from "../../../fixtures";
import { upper } from "../../../../src/query/postgresql/functions/string/sql";
import { update, updateFromObject } from "../../../../src/query/dsl/commands";
import { constant, ParamsWrapper } from "../../../../src/query/dsl/core";
import { PartialTableColumns, TableColumns } from "../../../../src/query/metamodel";
import assert = require('assert');

describe(`UPDATE commands`, function () {
	it(`supports updating a table with simple values`, function () {
		// Set up
		interface Params {
			name: string;
		}
		const paramsWrapper = new ParamsWrapper<Params>();
		const query = update<TUsers, Params>(QUsers)
			.set({
				name: upper(paramsWrapper.get((p) => p.name))
			})
			.where(QUsers.id.eq(constant(123)));

		// Execute
		const actual = query.toSql({
			name: 'fred'
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" as "t1" SET "name" = upper($1) WHERE "t1"."id" = $2`,
			parameters: ['fred', 123]
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports dynamically generating "set" criteria from an entity-like object`, function () {
		// Set up
		interface Params {
			id: TableColumns<TUsers>['id'];
		}

		const now = new Date('2020-04-01T14:30:00Z');

		const updates: PartialTableColumns<TUsers> = {
			deletedAt: now,
			name: 'fred'
		};
		const paramsWrapper = new ParamsWrapper<Params>();

		const query = updateFromObject<TUsers, Params>(QUsers, updates)
			.where(QUsers.id.eq(paramsWrapper.get((p) => p.id)));

		// Execute
		const actual = query.toSql({
			id: 123,
			...updates
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" as "t1" SET "deletedAt" = $1, "name" = $2 WHERE "t1"."id" = $3`,
			parameters: [now, 'fred', 123]
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports returning updated rows`, function () {
		// Set up
		interface Params {
			id: TableColumns<TUsers>['id'];
		}

		const now = new Date('2020-04-01T14:30:00Z');

		const updates: PartialTableColumns<TUsers> = {
			deletedAt: now,
			name: 'fred'
		};
		const paramsWrapper = new ParamsWrapper<Params>();

		const query = updateFromObject<TUsers, Params>(QUsers, updates)
			.where(QUsers.id.eq(paramsWrapper.get((p) => p.id)))
			.returning({
				updatedId: QUsers.id,
				name: QUsers.name,
			});

		// Execute
		const actual = query.toSql({
			id: 123,
			...updates
		});

		// Verify
		const expected = {
			sql: `UPDATE "Users" as "t1" SET "deletedAt" = $1, "name" = $2 WHERE "t1"."id" = $3 RETURNING ("t1"."id" as "updatedId", "t1"."name" as "name")`,
			parameters: [now, 'fred', 123]
		};
		assert.deepEqual(actual, expected);
	});
});

import { QLocations, QUsers, TUsers, UsersInsertRow } from "../../../fixtures";
import { deepFreeze, OptionalNulls } from "../../../../src/lang";
import { insert, insertFromObject } from "../../../../src/query/dsl/commands";
import { subSelect } from "../../../../src/query/dsl/select";
import { alias, aliasCol, col, constant, default_ } from "../../../../src/query/dsl/core";
import {
	ColumnMetamodel,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand,
	TableMetamodel
} from "../../../../src/query/metamodel";
import { params, ParamsWrapper, withParams } from "../../../../src/query/params";
import { doNothing, doUpdate, targetIndex } from "../../../../src/query/dsl/onConflict";
import { char_length, upper } from "../../../../src/query/postgresql/functions/string";
import { greaterThanOrEqual, lessThanOrEqual } from "../../../../src/query/postgresql/functions/comparison";
import assert = require('assert');

describe(`INSERT commands`, () => {
	it(`supports inserting a single row`, function () {
		// Set up
		interface Params extends TableColumns<TUsers> {

		}

		interface InsertRow extends TableColumnsForUpdateCommand<TUsers> {

		}
		const query = withParams<Params>()((p) => insert<TUsers, InsertRow>(QUsers)
			.insert({
				// NOTE: for this test, property names should not be in alphabetical order, to verify that
				// `insert()` explicitly sorts them.
				id: p.id,
				name: p.name,
				deletedAt: p.deletedAt,
				locationId: p.locationId
			}).finalise(p));

		// Execute
		const actual = query.toSql({
			id: 123,
			name: 'Fred',
			deletedAt: null,
			locationId: 456
		});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("deletedAt", "id", "locationId", "name") VALUES ($1, $2, $3, $4)`,
			parameters: [null, 123, 456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting a single row where casing differs between the object and the columns`, function () {
		// Set up
		class TUsers extends QueryTable {
			constructor($tableAlias? : string) { super(new TableMetamodel("Users", $tableAlias)); }

			id = new ColumnMetamodel<number>(this.$table, "id");
			locationId = new ColumnMetamodel<number>(this.$table, "location_id");
			name = new ColumnMetamodel<string>(this.$table, "name");
			deletedAt = new ColumnMetamodel<Date | null>(this.$table, "deleted_at");
		}
		const QUsers = deepFreeze(new TUsers());

		interface Params extends TableColumns<TUsers> {

		}

		interface InsertRow extends TableColumnsForUpdateCommand<TUsers> {

		}
		const p = params<Params>();
		const query = insert<TUsers, InsertRow>(QUsers)
			.insert({
				id: p.id,
				name: p.name,
				deletedAt: p.deletedAt,
				locationId: p.locationId
			});

		// Execute
		const actual = query.finalise(p).toSql({
			id: 123,
			name: 'Fred',
			deletedAt: null,
			locationId: 456
		});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("deleted_at", "id", "location_id", "name") VALUES ($1, $2, $3, $4)`,
			parameters: [null, 123, 456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	it(`can omit nullable fields`, function () {
		// Set up
		interface Params extends OptionalNulls<TableColumns<TUsers>> {

		}

		interface InsertRow extends TableColumnsForInsertCommand<TUsers> {
		}

		const paramsWrapper = new ParamsWrapper<Params>();
		const insertRow: InsertRow = {
			id: paramsWrapper.get((p) => p.id),
			name: paramsWrapper.get((p) => p.name),
			locationId: paramsWrapper.get((p) => p.locationId),
		};

		const query = insert<TUsers, InsertRow>(QUsers)
			.insert(insertRow);

		// Execute
		const actual = query.finalise(paramsWrapper).toSql({
			id: 123,
			name: 'Fred',
			locationId: 456
		});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES ($1, $2, $3)`,
			parameters: [123, 456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	it(`ignores properties that have a value of "undefined"`, function () {
		// Set up
		const query = withParams<Pick<UsersInsertRow, 'name' | 'locationId'>>()((p) =>
			insert(QUsers)
				.insert({
					id: default_(),
					name: p.name,
					locationId: p.locationId,
					deletedAt: undefined
				})
				.finalise(p)
		);

		// Execute
		const actual = query.toSql({
			name: 'Fred',
			locationId: 456
		});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES (DEFAULT, $1, $2)`,
			parameters: [456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	it(`errors when trying to insert values with a different number of properties`, function () {
		// Set up
		assert.throws(() => {
			withParams<Pick<UsersInsertRow, 'name' | 'locationId'>>()((p) =>
				insert(QUsers)
					.insert({
						id: default_(),
						name: p.name,
						locationId: p.locationId,
						deletedAt: undefined
					})
					.insert({
						id: default_(),
						name: p.name,
						locationId: p.locationId,
						deletedAt: default_()
					})
					.finalise(p)
			);
		}, (err: { message?: string } | undefined ) => {
			return err && err.message && err.message.startsWith(`Inserted row columns doesn't match the expected columns`);
		});
	});

	it(`supports dynamically generating inserted values from an entity-like object`, function () {
		// Set up
		interface InsertRow extends UsersInsertRow {
		}

		const insertRow: InsertRow = {
			id: 123,
			name: 'Fred',
			locationId: 456,
		};

		const query = insertFromObject<TUsers, InsertRow>(QUsers, insertRow);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES ($1, $2, $3)`,
			parameters: [123, 456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting from a sub-query, using alias to specify column name`, function () {
		// Set up
		const query = insert(QUsers)
			.insertFromQuery(
				subSelect(
					alias(col(QLocations.id), 'locationId')
				).where(QLocations.name.eq(constant('Launceston')))
					.toSubQuery(),
				[]
			);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" (SELECT "t2"."id" as "locationId" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting from a sub-query, using columns argument`, function () {
		// Set up
		const query = insert(QUsers)
			.insertFromQuery(
				subSelect(
					QLocations.id
				).where(QLocations.name.eq(constant('Launceston')))
					.toSubQuery(),
				[
					'locationId'
				]
			);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("locationId") (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting from a sub-query, inferring the (wrongly named) columns`, function () {
		// Set up
		const query = insert(QUsers)
			.insertFromQuery(
				subSelect(
					QLocations.id
				).where(QLocations.name.eq(constant('Launceston')))
					.toSubQuery()
			);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("id") (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting from a sub-query, inferring the (aliased) columns`, function () {
		// Set up
		const query = insert(QUsers)
			.insertFromQuery(
				subSelect(
					aliasCol(QLocations.id, 'locationId')
				).where(QLocations.name.eq(constant('Launceston')))
					.toSubQuery()
			);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("locationId") (SELECT "t2"."id" as "locationId" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports inserting from a sub-query, without specifying columns`, function () {
		// Set up
		const query = insert(QUsers)
			.insertFromQuery(
				subSelect(
					QLocations.id
				).where(QLocations.name.eq(constant('Launceston')))
					.toSubQuery(),
				[] // no column names
			);

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});

	it(`supports returning values`, () => {
		// Set up
		interface Params {

		}

		interface InsertRow extends UsersInsertRow {
		}

		const insertRow: InsertRow = {
			id: 123,
			name: 'Fred',
			locationId: 456,
		};

		const query = insertFromObject<TUsers, InsertRow>(QUsers, insertRow)
			.returning({
				newUserId: QUsers.id,
				name: QUsers.name,
				locationId: QUsers.locationId,
			});

		// Execute
		const actual = query.finalise({}).toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES ($1, $2, $3) RETURNING "t1"."id" as "newUserId", "t1"."name" as "name", "t1"."locationId" as "locationId"`,
			parameters: [123, 456, 'Fred'] // In order of column name (sorted alphabetically)
		};
		assert.deepEqual(actual, expected);
	});

	describe(`on conflict`, () => {
		describe(`do update`, () => {
			it(`can pass column references`, () => {
				// Execute
				const actual = insert(QUsers)
					.insert({
						id: default_(),
						locationId: constant(123),
						name: constant('Fred')
					})
					.onConflict(
						doUpdate().onColumns([QUsers.name]).set(QUsers, {
							name: constant('Fred 2')
						})
					).finalise({}).toSql({});

				// Verify
				const expected = {
					sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES (DEFAULT, $1, $2) ON CONFLICT ("name") DO UPDATE SET "name" = $3`,
					parameters: [123, 'Fred', 'Fred 2']
				};
				assert.deepEqual(actual, expected);
			});

			it(`can pass constraint reference`, () => {
				// Execute
				const actual = insert(QUsers)
					.insert({
						id: default_(),
						locationId: constant(123),
						name: constant('Fred')
					})
					.onConflict(
						doUpdate().onConstraint('foo_constraint').set(QUsers, {
							name: constant('Fred 2')
						})
					).finalise({}).toSql({});

				// Verify
				const expected = {
					sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES (DEFAULT, $1, $2) ON CONFLICT ON CONSTRAINT "foo_constraint" DO UPDATE SET "name" = $3`,
					parameters: [123, 'Fred', 'Fred 2']
				};
				assert.deepEqual(actual, expected);
			});

			it(`can pass indexes`, () => {
				// Execute
				const actual = insert(QUsers)
					.insert({
						id: default_(),
						locationId: constant(123),
						name: constant('Fred')
					})
					.onConflict(
						doUpdate().onIndexes(
							[
								targetIndex(upper(QUsers.name.scol()), { opclass: 'text_pattern_ops', collation: 'en_US' })
							], lessThanOrEqual(
								char_length(QUsers.name.scol()),
								constant(10)
							)
						).set(QUsers, {
							name: constant('Fred 2')
						}).where(
							greaterThanOrEqual(char_length(QUsers.name.scol()), constant(5))
						)
					).finalise({}).toSql({});

				// Verify
				const expected = {
					sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES (DEFAULT, $1, $2) ON CONFLICT (upper("name") COLLATE 'en_US' "text_pattern_ops") WHERE char_length("name") <= $3 DO UPDATE SET "name" = $4 WHERE char_length("name") >= $5`,
					parameters: [123, 'Fred', 10, 'Fred 2', 5]
				};
				assert.deepEqual(actual, expected);
			});
		});

		describe(`do nothing`, () => {
			it(`can pass indexes`, () => {
				// Execute
				const actual = insert(QUsers)
					.insert({
						id: default_(),
						locationId: constant(123),
						name: constant('Fred')
					})
					.onConflict(
						doNothing().onIndexes(
							[
								targetIndex(upper(QUsers.name.scol()), { opclass: 'text_pattern_ops', collation: 'en_US' })
							], lessThanOrEqual(
								char_length(QUsers.name.scol()),
								constant(10)
							)
						)
					).finalise({}).toSql({});

				// Verify
				const expected = {
					sql: `INSERT INTO "Users" as "t1" ("id", "locationId", "name") VALUES (DEFAULT, $1, $2) ON CONFLICT (upper("name") COLLATE 'en_US' "text_pattern_ops") WHERE char_length("name") <= $3 DO NOTHING`,
					parameters: [123, 'Fred', 10]
				};
				assert.deepEqual(actual, expected);
			});
		});
	});
});

import { QLocations, QUsers, TUsers, UsersInsertRow } from "../../../fixtures";
import { deepFreeze, OptionalNulls } from "../../../../src/lang";
import { insert, insertFromObject } from "../../../../src/query/dsl/commands";
import { subSelect } from "../../../../src/query/dsl/select";
import { alias, aliasCol, col, constant, ParamsWrapper } from "../../../../src/query/dsl/core";
import {
	ColumnMetamodel,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand,
	TableMetamodel
} from "../../../../src/query/metamodel";
import assert = require('assert');

describe(`INSERT commands`, () => {
	it(`supports inserting a single row`, function () {
		// Set up
		interface Params extends TableColumns<TUsers> {

		}

		interface InsertRow extends TableColumnsForUpdateCommand<TUsers> {

		}
		const paramsWrapper = new ParamsWrapper<Params>();
		const query = insert<TUsers, InsertRow, Params>(QUsers)
			.insert({
				// NOTE: for this test, property names should not be in alphabetical order, to verify that
				// `insert()` explicitly sorts them.
				id: paramsWrapper.get((p) => p.id),
				name: paramsWrapper.get((p) => p.name),
				deletedAt: paramsWrapper.get((p) => p.deletedAt),
				locationId: paramsWrapper.get((p) => p.locationId)
			});

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
		const paramsWrapper = new ParamsWrapper<Params>();
		const query = insert<TUsers, InsertRow, Params>(QUsers)
			.insert({
				id: paramsWrapper.get((p) => p.id),
				name: paramsWrapper.get((p) => p.name),
				deletedAt: paramsWrapper.get((p) => p.deletedAt),
				locationId: paramsWrapper.get((p) => p.locationId)
			});

		// Execute
		const actual = query.toSql({
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

		const query = insert<TUsers, InsertRow, Params>(QUsers)
			.insert(insertRow);

		// Execute
		const actual = query.toSql({
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

	it(`supports dynamically generating inserted values from an entity-like object`, function () {
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

		const query = insertFromObject<TUsers, InsertRow, Params>(QUsers, insertRow);

		// Execute
		const actual = query.toSql({});

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
		const actual = query.toSql({});

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
		const actual = query.toSql({});

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
		const actual = query.toSql({});

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
		const actual = query.toSql({});

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
		const actual = query.toSql({});

		// Verify
		const expected = {
			sql: `INSERT INTO "Users" as "t1" (SELECT "t2"."id" FROM "Locations" as "t2" WHERE "t2"."name" = $1)`,
			parameters: ['Launceston']
		};
		assert.deepEqual(actual, expected);
	});
});

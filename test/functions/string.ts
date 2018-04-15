import * as assert from "assert";
import {QUsers} from "../fixtures";
import {col, constant, select, selectExpression} from "../../src/query/dsl";
import {trim} from "../../src/query/postgresql/functions/string/sql";
import {btrim, pg_client_encoding} from "../../src/query/postgresql/functions/string/other";

describe(`String functions`, function () {
	describe(`btrim()`, function () {
		it(`without characters`, function () {
			const querySelect = {
				name: selectExpression(btrim(col(QUsers.name)))
			};

			const actual = select(querySelect).toSql({});
			const expected = {
				sql: `SELECT btrim("t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: []
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			const querySelect = {
				name: selectExpression(btrim(col(QUsers.name), constant("abcd1234")))
			};

			const actual = select(querySelect).toSql({});
			const expected = {
				sql: `SELECT btrim("t1"."name", $1) as "name" FROM "Users" as "t1"`,
				parameters: ["abcd1234"]
			};
			assert.deepEqual(actual, expected);
		});
	});

	it(`pg_client_encoding()`, function() {
		const querySelect = {
			clientEncoding: selectExpression(pg_client_encoding())
		};

		const actual = select(querySelect).toSql({});
		const expected = {
			sql: `SELECT pg_client_encoding() as "clientEncoding"`,
			parameters: []
		};
		assert.deepEqual(actual, expected);
	});

	describe(`trim()`, function () {
		it(`without characters`, function () {
			const querySelect = {
				name: selectExpression(trim("both", col(QUsers.name)))
			};

			const actual = select(querySelect).toSql({});
			const expected = {
				sql: `SELECT trim($1 from "t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: ["both"] // odd, "both" should be a keyword, but this seems to work in pgsql.
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			const querySelect = {
				name: selectExpression(trim("both", col(QUsers.name), constant("abcd1234")))
			};

			const actual = select(querySelect).toSql({});
			const expected = {
				sql: `SELECT trim($1 $2 from "t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: ["both", "abcd1234"]
			};
			assert.deepEqual(actual, expected);
		});
	});
});
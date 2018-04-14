import * as assert from "assert";
import {QUsers} from "../fixtures";
import {col, constant, Expression, select} from "../../src/query/dsl";
import {trim} from "../../src/query/postgresql/functions/string/sql";
import {btrim, pg_client_encoding} from "../../src/query/postgresql/functions/string/other";

describe(`String functions`, function () {
	describe(`btrim()`, function () {
		it(`without characters`, function () {
			class QuerySelect {
				@Expression(btrim(col(QUsers.name)))
				name! : string;
			}

			const actual = select(QuerySelect).toSql({});
			const expected = {
				sql: `SELECT btrim("t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: []
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			class QuerySelect {
				@Expression(btrim(col(QUsers.name), constant("abcd1234")))
				name! : string;
			}

			const actual = select(QuerySelect).toSql({});
			const expected = {
				sql: `SELECT btrim("t1"."name", $1) as "name" FROM "Users" as "t1"`,
				parameters: ["abcd1234"]
			};
			assert.deepEqual(actual, expected);
		});
	});

	it(`pg_client_encoding()`, function() {
		class QuerySelect {
			@Expression(pg_client_encoding())
			clientEncoding! : string;
		}

		const actual = select(QuerySelect).toSql({});
		const expected = {
			sql: `SELECT pg_client_encoding() as "clientEncoding"`,
			parameters: []
		};
		assert.deepEqual(actual, expected);
	});

	describe(`trim()`, function () {
		it(`without characters`, function () {
			class QuerySelect {
				@Expression(trim("both", col(QUsers.name)))
				name! : string;
			}

			const actual = select(QuerySelect).toSql({});
			const expected = {
				sql: `SELECT trim($1 from "t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: ["both"] // odd, "both" should be a keyword, but this seems to work in pgsql.
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			class QuerySelect {
				@Expression(trim("both", col(QUsers.name), constant("abcd1234")))
				name! : string;
			}

			const actual = select(QuerySelect).toSql({});
			const expected = {
				sql: `SELECT trim($1 $2 from "t1"."name") as "name" FROM "Users" as "t1"`,
				parameters: ["both", "abcd1234"]
			};
			assert.deepEqual(actual, expected);
		});
	});
});
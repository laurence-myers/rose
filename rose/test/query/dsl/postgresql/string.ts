import * as assert from "assert";
import { QUsers } from "../../../fixtures";
import { select } from "../../../../src/query/dsl/commands";
import { trim } from "../../../../src/query/dsl/postgresql/string/sql";
import {
	btrim,
	pg_client_encoding,
} from "../../../../src/query/dsl/postgresql/string/other";
import { selectExpression } from "../../../../src/query/dsl/select";
import { col, constant } from "../../../../src/query/dsl/core";
import { QuerySelector, withParams } from "../../../../src/query";

describe(`String functions`, function () {
	function wrapQuery<T extends QuerySelector>(querySelect: T) {
		return withParams()((p) => select(querySelect).finalise(p).toSql({}));
	}

	describe(`btrim()`, function () {
		it(`without characters`, function () {
			const querySelect = {
				name: selectExpression(btrim(col(QUsers.name))),
			};

			const actual = wrapQuery(querySelect);
			const expected = {
				sql: `SELECT btrim("Users"."name") as "name" FROM "Users"`,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			const querySelect = {
				name: selectExpression(btrim(col(QUsers.name), constant("abcd1234"))),
			};

			const actual = wrapQuery(querySelect);
			const expected = {
				sql: `SELECT btrim("Users"."name", $1) as "name" FROM "Users"`,
				parameters: ["abcd1234"],
			};
			assert.deepEqual(actual, expected);
		});
	});

	it(`pg_client_encoding()`, function () {
		const querySelect = {
			clientEncoding: selectExpression(pg_client_encoding()),
		};

		const actual = wrapQuery(querySelect);
		const expected = {
			sql: `SELECT pg_client_encoding() as "clientEncoding"`,
			parameters: [],
		};
		assert.deepEqual(actual, expected);
	});

	describe(`trim()`, function () {
		it(`without characters`, function () {
			const querySelect = {
				name: selectExpression(trim("both", col(QUsers.name))),
			};

			const actual = wrapQuery(querySelect);
			const expected = {
				sql: `SELECT trim($1 from "Users"."name") as "name" FROM "Users"`,
				parameters: ["both"], // odd, "both" should be a keyword, but this seems to work in pgsql.
			};
			assert.deepEqual(actual, expected);
		});

		it(`with characters`, function () {
			const querySelect = {
				name: selectExpression(
					trim("both", col(QUsers.name), constant("abcd1234"))
				),
			};

			const actual = wrapQuery(querySelect);
			const expected = {
				sql: `SELECT trim($1 $2 from "Users"."name") as "name" FROM "Users"`,
				parameters: ["both", "abcd1234"],
			};
			assert.deepEqual(actual, expected);
		});
	});
});

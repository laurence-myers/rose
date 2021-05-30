import {
	caseMulti,
	caseSimple,
} from "../../../../src/query/dsl/postgresql/conditional";
import { QProject } from "../../../fixtures";
import { constant } from "../../../../src/query/dsl";
import { SqlAstWalker } from "../../../../src/query/walkers/sqlAstWalker";
import * as assert from "assert";

describe(`Conditional Expressions`, function () {
	describe(`caseMulti`, () => {
		it(`generates expected nodes`, () => {
			// Execute
			const node = caseMulti()
				.when(QProject.status.eq(constant("Active")), constant("Ready to Go"))
				.else(constant("Requires work"))
				.end();
			const actual = new SqlAstWalker(node).toSql();

			// Verify
			const expected = `CASE WHEN "t1"."status" = $1 THEN $2 ELSE $3`;
			assert.deepEqual(actual.sql, expected);
		});
	});

	describe(`caseSimple`, () => {
		it(`generates expected nodes`, () => {
			// Execute
			const node = caseSimple(QProject.status.scol())
				.when(constant("Active"), constant("Ready to Go"))
				.else(constant("Requires work"))
				.end();
			const actual = new SqlAstWalker(node).toSql();

			// Verify
			const expected = `CASE "status" WHEN $1 THEN $2 ELSE $3`;
			assert.deepEqual(actual.sql, expected);
		});
	});
});

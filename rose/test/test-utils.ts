import { AstNode } from "../src";
import { SqlAstWalker } from "../src/query/walkers/sqlAstWalker";
import * as assert from "assert";

export function doSimpleSqlTest(astNode: AstNode, expectedSql: string) {
	// Execute
	const result = new SqlAstWalker(astNode).toSql().sql;

	// Verify
	assert.deepEqual(result, expectedSql);
}

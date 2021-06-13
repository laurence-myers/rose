import { AstNode } from "../src";
import { SqlAstWalker } from "../src/query/walkers/sqlAstWalker";
import * as assert from "assert";
import { TableMap } from "../src/data";

export function doSimpleSqlTest(
	astNode: AstNode,
	expectedSql: string,
	tableMap?: TableMap | undefined
) {
	// Execute
	const result = new SqlAstWalker(astNode, tableMap).toSql().sql;

	// Verify
	assert.deepEqual(result, expectedSql);
}

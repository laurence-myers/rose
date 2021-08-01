import { ColumnMetadata } from "../../src/codegen/dbmetadata";
import { defaultPostgresTypeMap } from "../../src/codegen/dbtypes";
import assert = require("assert");

describe(`dbmetadata`, () => {
	describe(`ColumnMetadata`, () => {
		it(`maps hstores to strings (by default)`, () => {
			// Execute
			const metamodel = new ColumnMetadata(
				"foo",
				"bar",
				"hstore",
				false,
				false,
				{
					columns: new Map(),
					enums: new Map(),
					global: defaultPostgresTypeMap,
				}
			);

			// Verify
			assert.deepStrictEqual(metamodel.tsType, {
				importName: "string",
				type: "string",
			});
		});
	});
});

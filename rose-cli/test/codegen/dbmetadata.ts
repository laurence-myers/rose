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

		it(`maps arrays of "text"`, () => {
			// Execute
			const metamodel = new ColumnMetadata(
				"foo",
				"bar",
				"_text",
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
				type: "Array<string>",
			});
		});

		it(`maps nullable arrays of "text"`, () => {
			// Execute
			const metamodel = new ColumnMetadata("foo", "bar", "_text", true, false, {
				columns: new Map(),
				enums: new Map(),
				global: defaultPostgresTypeMap,
			});

			// Verify
			assert.deepStrictEqual(metamodel.tsType, {
				importName: "string",
				type: "Array<string> | null",
			});
		});

		it(`maps arrays of enums`, () => {
			// Execute
			const metamodel = new ColumnMetadata(
				"foo",
				"bar",
				"_enum_type_1",
				false,
				false,
				{
					columns: new Map(),
					enums: new Map([
						[
							"enum_type_1",
							{
								type: `'active' | 'locked' | 'pending' | 'disabled'`,
							},
						],
					]),
					global: defaultPostgresTypeMap,
				}
			);

			// Verify
			assert.deepStrictEqual(metamodel.tsType, {
				importName: "'active' | 'locked' | 'pending' | 'disabled'",
				type: "Array<'active' | 'locked' | 'pending' | 'disabled'>",
			});
		});
	});
});

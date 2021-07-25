import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as arp from "app-root-path";
import { ColumnMetadata, TableMetadata } from "../../src/codegen/dbmetadata";
import { generateTableCode } from "../../src/codegen/generators";
import { IntrospectConfig } from "../../src/config";
import { defaultPostgresTypeMap } from "../../src/codegen/dbtypes";

describe(`Code generators`, () => {
	describe(`generateTableCode()`, () => {
		function readExpectedCode(testNumber: number): string {
			const filePath = arp.resolve(
				path.join(
					"test",
					"codegen",
					"data",
					`generateTableCode${testNumber}.txt`
				)
			);
			return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
		}

		function getTypeMaps(): IntrospectConfig["types"] {
			return {
				global: defaultPostgresTypeMap,
				columns: new Map([
					[
						"foo_table.custom_type_1",
						{
							type: `'bar' | 'baz'`,
						},
					],
					[
						"foo_table.custom_type_2",
						{
							type: `CustomType2`,
							from: "../../src/customTypeProvider",
						},
					],
					[
						"foo_table.custom_type_3",
						{
							type: `CustomType2`,
							from: "../../src/customTypeProvider",
						},
					],
				]),
				enums: new Map([
					[
						"enum_type_1",
						{
							type: `'active' | 'locked' | 'pending' | 'disabled'`,
						},
					],
				]),
			};
		}

		function* generateData(counter: () => string) {
			const tableName = "foo_table";
			const typeMaps = getTypeMaps();
			for (const type of ["int", "text", "timestamptz"]) {
				for (const isNullable of [false, true]) {
					for (const hasDefault of [false, true]) {
						yield new ColumnMetadata(
							tableName,
							counter(),
							type,
							isNullable,
							hasDefault,
							typeMaps
						);
					}
				}
			}
			yield new ColumnMetadata(
				tableName,
				"custom_type_1",
				"text",
				true,
				false,
				typeMaps
			);
			yield new ColumnMetadata(
				tableName,
				"custom_type_2",
				"json",
				true,
				false,
				typeMaps
			);
			yield new ColumnMetadata(
				tableName,
				"custom_type_3",
				"json",
				false,
				false,
				typeMaps
			);
			yield new ColumnMetadata(
				tableName,
				"enum_type_1",
				"enum_type_1",
				true,
				false,
				typeMaps
			);
		}

		it(`should support integer, string, and date column types, with nulls`, async () => {
			// Set up
			const tableMetadata = new TableMetadata(`public`, `foo_table`);
			let count = 0;
			const col = () => `column_${++count}`;

			for (const data of generateData(col)) {
				tableMetadata.columns.push(data);
			}

			// Execute
			const result = generateTableCode(tableMetadata);

			// Verify
			const expected = readExpectedCode(1);
			assert.deepEqual(result, expected);
		});

		it(`produces the import statement when there's no custom types`, async () => {
			// Set up
			const tableName = `foo_table`;
			const tableMetadata = new TableMetadata(`public`, tableName);
			const typeMaps = getTypeMaps();

			tableMetadata.columns.push(
				new ColumnMetadata(tableName, "id", "int", false, true, typeMaps)
			);

			// Execute
			const result = generateTableCode(tableMetadata);

			// Verify
			const expected = readExpectedCode(2);
			assert.deepEqual(result, expected);
		});
	});
});

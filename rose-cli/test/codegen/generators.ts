import * as assert from "assert";
import * as fs from 'fs';
import * as path from 'path';
import * as arp from 'app-root-path';
import { ColumnMetadata, TableMetadata } from "../../src/codegen/dbmetadata";
import { generateTableCode } from "../../src/codegen/generators";

describe(`Code generators`, () => {
	describe(`generateTableCode()`, () => {
		function readExpectedCode(testNumber: number): string {
			const filePath = arp.resolve(path.join('test', 'codegen', 'data', `generateTableCode${ testNumber }.txt`));
			return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
		}

		function* generateData(counter: () => string) {
			for (const type of ['int', 'text', 'timestamptz']) {
				for (const isNullable of [false, true]) {
					for (const hasDefault of [false, true]) { // TODO: test "hasDefault" of "true"
						yield new ColumnMetadata(counter(), type, isNullable, hasDefault);
					}
				}
			}
		}

		it(`should support integer, string, and date column types, with nulls`, async () => {
			// Set up
			const tableMetadata = new TableMetadata(`public`, `foo_table`);
			let count = 0;
			const col = () => `column_${ ++count }`;

			for (const data of generateData(col)) {
				tableMetadata.columns.push(data);
			}

			// Execute
			const result = generateTableCode(tableMetadata);

			// Verify
			const expected = readExpectedCode(1);
			assert.deepEqual(result, expected);
		});
	});
});

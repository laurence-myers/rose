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

		it(`should support integer, string, and date column types, with nulls`, async () => {
			// Set up
			const tableMetadata = new TableMetadata(`FooTable`);
			let count = 0;
			const col = () => `column_${ ++count }`;

			tableMetadata.columns.push(
				new ColumnMetadata(col(), `int`, false),
				new ColumnMetadata(col(), `int`, true),
				new ColumnMetadata(col(), `text`, false),
				new ColumnMetadata(col(), `text`, true),
				new ColumnMetadata(col(), `timestamptz`, false),
				new ColumnMetadata(col(), `timestamptz`, true),
			);

			// Execute
			const result = generateTableCode(tableMetadata);

			// Verify
			const expected = readExpectedCode(1);
			assert.deepEqual(result, expected);
		});
	});
});

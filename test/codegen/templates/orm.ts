import { ColumnMetadata, TableMetadata } from "../../../src/codegen/dbmetadata";
import { OrmTemplate } from "../../../src/codegen/templates/orm";
import * as assert from "assert";
import * as arp from "app-root-path";
import * as path from "path";
import * as fs from "fs";

describe(`OrmTemplate`, () => {
	function readExpectedCode(testNumber: number): string {
		const filePath = arp.resolve(path.join('test', 'codegen', 'templates', 'data', `OrmTemplate${ testNumber }.txt`));
		return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
	}

	it(`generates getOne() with a single column primary key`, () => {
		// Setup
		const tableMetadata = new TableMetadata(`public`, `foo_table`);
		tableMetadata.columns.push(
			new ColumnMetadata('id', 'int', false, true)
		);
		tableMetadata.primaryKeys.push('id');

		// Execute
		const result = OrmTemplate(tableMetadata);

		// Verify
		assert.deepEqual(result, readExpectedCode(1));
	});

	it(`generates getOne() with a composite primary key`, () => {
		// Setup
		const tableMetadata = new TableMetadata(`public`, `foo_table`);
		tableMetadata.columns.push(
			new ColumnMetadata('name', 'text', false, true),
			new ColumnMetadata('created_at', 'date', false, true),
		);
		tableMetadata.primaryKeys.push('name');
		tableMetadata.primaryKeys.push('created_at');

		// Execute
		const result = OrmTemplate(tableMetadata);

		// Verify
		assert.deepEqual(result, readExpectedCode(2));
	});
});

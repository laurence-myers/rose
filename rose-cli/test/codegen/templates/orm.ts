import { ColumnMetadata, TableMetadata } from "../../../src/codegen/dbmetadata";
import { OrmTemplate } from "../../../src/codegen/templates/orm";
import * as assert from "assert";
import * as arp from "app-root-path";
import * as path from "path";
import * as fs from "fs";
import { astToString } from "tscodegendsl";
import { IntrospectConfig } from "../../../src/config";
import { defaultPostgresTypeMap } from "../../../src/codegen/dbtypes";

describe(`OrmTemplate`, () => {
	const tableName = `foo_table`;
	const typeMaps: IntrospectConfig['types'] = {
		global: defaultPostgresTypeMap,
		columns: new Map(),
		enums: new Map()
	};

	function readExpectedCode(testNumber: number): string {
		const filePath = arp.resolve(path.join('test', 'codegen', 'templates', 'data', `OrmTemplate${ testNumber }.txt`));
		return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
	}

	it(`generates getOne() with a single column primary key`, () => {
		// Setup
		const tableMetadata = new TableMetadata(`public`, tableName);
		tableMetadata.columns.push(
			new ColumnMetadata(tableName, 'id', 'int', false, true, typeMaps)
		);
		tableMetadata.primaryKeys.push('id');

		// Execute
		const result: string = astToString(OrmTemplate(tableMetadata));

		// Verify
		assert.deepEqual(result, readExpectedCode(1));
	});

	it(`generates getOne() with a composite primary key`, () => {
		// Setup
		const tableMetadata = new TableMetadata(`public`, `foo_table`);
		tableMetadata.columns.push(
			new ColumnMetadata(tableName, 'name', 'text', false, true, typeMaps),
			new ColumnMetadata(tableName, 'created_at', 'date', false, true, typeMaps),
		);
		tableMetadata.primaryKeys.push('name');
		tableMetadata.primaryKeys.push('created_at');

		// Execute
		const result: string = astToString(OrmTemplate(tableMetadata));

		// Verify
		assert.deepEqual(result, readExpectedCode(2));
	});
});

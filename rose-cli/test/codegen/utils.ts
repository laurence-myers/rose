import { imp, impAll, namedImport } from "../../src/codegen/dsl";
import { mergeImports, uniqueImports } from "../../src/codegen/utils";
import * as assert from "assert";
import { ImportNode } from "../../src/codegen/ast";

describe(`utils`, () => {
	describe(`mergeImports()`, () => {
		it(`should merge duplicate named imports`, async () => {
			// Set up
			const imports1 = [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			];
			const imports2 = [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			];

			// Execute
			const result = mergeImports(imports1, imports2);

			// Verify
			assert.deepEqual(result, [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			]);
		});

		it(`should NOT merge duplicate named imports when passed the same array`, async () => {
			// Set up
			const imports1 = [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar'),
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			];

			// Execute
			const result = mergeImports(imports1, imports1);

			// Verify
			assert.deepEqual(result, [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar'),
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			]);
		});

		it(`should merge duplicate "all" imports`, async () => {
			// Set up
			const imports1 = [
				impAll('../bar', 'bar')
			];
			const imports2 = [
				impAll('../bar', 'bar')
			];

			// Execute
			const result = mergeImports(imports1, imports2);

			// Verify
			assert.deepEqual(result, [
				impAll('../bar', 'bar')
			]);
		});


		it(`should include all imports of 2 if 1 is empty`, async () => {
			// Set up
			const imports1: ImportNode[] = [
			];
			const imports2 = [
				impAll('../bar', 'bar')
			];

			// Execute
			const result = mergeImports(imports1, imports2);

			// Verify
			assert.deepEqual(result, [
				impAll('../bar', 'bar')
			]);
		});
	});

	describe(`uniqueImports()`, () => {
		it(`should deduplicate named imports`, async () => {
			// Set up
			const imports1 = [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar'),
				imp([
					namedImport(
						'Foo'
					),
				], 'bar')
			];

			// Execute
			const result = uniqueImports(imports1);

			// Verify
			assert.deepEqual(result, [
				imp([
					namedImport(
						'Foo'
					),
				], 'bar'),
			]);
		});
	});
});

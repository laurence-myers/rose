import {
	sanitizeColumnName,
	sanitizeTableName,
} from "../../../src/codegen/templates/common";
import * as assert from "assert";

describe(`Common template functions`, () => {
	describe(`sanitizeColumnName()`, () => {
		it(`removes whitespace`, () => {
			const expected = `zipCode`;

			const result = sanitizeColumnName(`zip code`);

			assert.deepEqual(result, expected);
		});
	});

	describe(`sanitizeTableName()`, () => {
		it(`Capitalises the first letter`, () => {
			const expected = `CustomerAddress`;

			const result = sanitizeTableName(`customer_address`);

			assert.deepEqual(result, expected);
		});
	});
});

import { QAgencies, QLocations, QUsers, TLocations, TUsers, UsersInsertRow } from "../../../fixtures";
import { lower, upper } from "../../../../src/query/postgresql/functions/string/sql";
import { count } from "../../../../src/query/postgresql/functions/aggregate/general";
import { deepFreeze, OptionalNulls } from "../../../../src/lang";
import { deleteFrom, insert, insertFromObject, select, update, updateFromObject } from "../../../../src/query/dsl/commands";
import { selectExpression, selectNestedMany, subSelect } from "../../../../src/query/dsl/select";
import { alias, aliasCol, and, col, constant, not, or, ParamsWrapper } from "../../../../src/query/dsl/core";
import {
	ColumnMetamodel,
	PartialTableColumns,
	QueryTable,
	TableColumns,
	TableColumnsForInsertCommand,
	TableColumnsForUpdateCommand,
	TableMetamodel
} from "../../../../src/query/metamodel";
import { AsQuerySelector } from "../../../../src/query";
import assert = require('assert');

describe(`DELETE commands`, () => {
	it(`supports deleting from a table with constant criteria`, function () {
		// Set up
		const query = deleteFrom(QUsers)
			.where(QUsers.id.eq(constant(123)));

		// Execute
		const actual = query.toSql({});

		// Verify
		const expected = {
			sql: `DELETE FROM "Users" as "t1" WHERE "t1"."id" = $1`,
			parameters: [
				123
			]
		};
		assert.deepEqual(actual, expected);
	});

	xit(`supports returning a selection`, function () {});
});

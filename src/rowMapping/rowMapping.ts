/// <reference path="../../typings/custom.d.ts" />
import {SelectOutputExpression} from "../query/ast";
import {NotImplementedError, UnsupportedOperationError} from "../errors";
import {assertNever} from "../lang";
import {getNestedPropertyNames} from "../query/metadata";
import {MetroHash128} from "metrohash";

const HASH_SEED = Date.now();

interface Aliases {
	input : string;
	output : string;
}

interface NestedPathResult {
	nestedObject : any;
	key : string;
}

function processNestedPathSegment(arrayKey : string, output : any) {
	let nestedObject : any;
	if (!(<any> output)[arrayKey]) {
		const arr : any[] = [];
		(<any> output)[arrayKey] = arr;
		nestedObject = {};
		arr.push(nestedObject);
	} else {
		nestedObject = (<any> output)[arrayKey][0];
	}
	return nestedObject;
}

function processNestedPath(fullPath : string, output : any) : NestedPathResult {
	const allSegments = fullPath.split('.');
	const segments = allSegments.slice(0, allSegments.length - 1);
	let nestedObject = segments.reduce((nestedObject : any, segment : string) => {
		return processNestedPathSegment(segment, nestedObject);
	}, output);
	return {
		key: allSegments[allSegments.length - 1],
		nestedObject
	};
}

function processOutputExpression(expr : SelectOutputExpression, row : any, output : any, aliases? : Aliases) : void {
	switch (expr.type) {
		case "aliasedExpressionNode":
			if (expr.alias.indexOf('.') > -1) {
				const { key, nestedObject } = processNestedPath(expr.alias, output);
				processOutputExpression(expr.expression, row, nestedObject, {
					input: expr.alias,
					output: key
				});
			} else {
				processOutputExpression(expr.expression, row, output, {
					input: expr.alias,
					output: expr.alias
				});
			}
			break;

		case "columnReferenceNode":
			// TODO: verify that the key exists in the row
			const outputKey = aliases ? aliases.output : expr.columnName;
			const inputKey = aliases ? aliases.input : expr.columnName;
			(<any> output)[outputKey] = row[inputKey];
			break;

		case "functionExpressionNode":
			if (!aliases || !aliases.input || !aliases.output) {
				throw new UnsupportedOperationError("All row columns must be aliased");
			} else {
				const outputKey = aliases.output;
				const inputKey = aliases.input;
				(<any> output)[outputKey] = row[inputKey];
			}
			break;

		case "constantNode":
		case "binaryOperationNode":
		case "unaryOperationNode":
			throw new UnsupportedOperationError("Returning constants, binary operations, or unary operations as selection values is not currently supported.");

		default:
			assertNever(expr);
	}
}

export function mapRowToClass<TDataClass>(clz : { new() : TDataClass }, outputExpressions : SelectOutputExpression[], row : any) : TDataClass {
	const output = new clz();

	for (const expr of outputExpressions) {
		processOutputExpression(expr, row, output);
	}
	return output;
}

function hashRow<TDataClass>(row : TDataClass, nestedPropertyNames : string[]) : string {
	const hash = new MetroHash128(HASH_SEED);
	for (const key in Object.keys(row)) {
		if (nestedPropertyNames.indexOf(key) == -1) { // TODO: replace the array lookup with a set
			hash.update(`${ key }=${ (<any> row)[key] };`);
		}
	}
	return hash.digest();
}

function mergeRows<TDataClass>(dst : TDataClass, src : TDataClass, nestedPropertyNames : string[]) : void {
	for (const propName of nestedPropertyNames) {
		const dstArr = (<any> dst)[propName];
		for (const val of (<any> src)[propName]) {
			dstArr.push(val);
		}
	}
}

/**
 * Select statements can contain values from multiple tables, and are not limited to primary keys of those tables.
 * The only way to distinguish rows is to hash all the non-nested values.
 */
function mergeNestedRows<TDataClass>(convertedRows : TDataClass[], outputExpressions : SelectOutputExpression[], nestedPropertyNames : string[]) : TDataClass[] {
	const rowMap = new Map<string, TDataClass>();
	for (const convertedRow of convertedRows) {
		const hash = hashRow(convertedRow, nestedPropertyNames);
		let row = rowMap.get(hash);
		if (row) {
			mergeRows(row, convertedRow, nestedPropertyNames);
		} else {
			row = convertedRow;
			rowMap.set(hash, row);
		}
	}
	return Array.from(rowMap.values());
}

export function mapRowsToClass<TDataClass>(clz : { new() : TDataClass }, outputExpressions : SelectOutputExpression[], rows : any[]) : TDataClass[] {
	const convertedRows = rows.map((row) => mapRowToClass(clz, outputExpressions, row));
	const nestedPropertyNames = getNestedPropertyNames(clz);
	if (nestedPropertyNames.length > 0) {
		return mergeNestedRows(convertedRows, outputExpressions, nestedPropertyNames);
	} else {
		return convertedRows;
	}
}

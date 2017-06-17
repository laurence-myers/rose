/// <reference path="../../typings/custom.d.ts" />
import {SelectOutputExpression} from "../query/ast";
import {RowMappingError, UnsupportedOperationError} from "../errors";
import {assertNever, DefaultMap, last, logObject, SettingMap} from "../lang";
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

function processNestedPath(allSegments : string[], output : any) : NestedPathResult {
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
				const { key, nestedObject } = processNestedPath(expr.aliasPath, output);
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
		case "functionExpressionNode":
		case "naturalSyntaxFunctionExpressionNode":
		case "constantNode":
		case "binaryOperationNode":
		case "unaryOperationNode":
		case "subSelectNode":
			if (!aliases || !aliases.input || !aliases.output) {
				throw new UnsupportedOperationError("All output values must be aliased");
			} else if (row[aliases.input] === undefined) {
				throw new RowMappingError(`Expected row to have a column named "${ aliases.input }"`);
			} else {
				const outputKey = aliases.output;
				const inputKey = aliases.input;
				(<any> output)[outputKey] = row[inputKey];
			}
			break;

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

function hashRow<TDataClass>(row : TDataClass, propertiesToHash : string[]) : string {
	const hash = new MetroHash128(HASH_SEED);
	for (const key of propertiesToHash) {
		hash.update(`${ key }=${ (<any> row)[key] };`);
	}
	return hash.digest();
}

/**
 * Select statements can contain values from multiple tables, and are not limited to primary keys of those tables.
 * The only way to distinguish rows is to hash all the non-nested values.
 */
function mergeNested(objects : any, nestedSchema : NestedSchema) : any[] {
	const hashMap = new SettingMap<string, any>();
	for (const obj of objects) {
		const hash = hashRow(obj, nestedSchema.values);
		const objToUpdate = hashMap.getOrSet(hash, obj);
		for (const [key, value] of nestedSchema.nested.entries()) {
			objToUpdate[key] = mergeNested(objToUpdate[key].concat(obj[key]), value);
		}
	}
	return Array.from(hashMap.values());
}

export function mapRowsToClass<TDataClass>(clz : { new() : TDataClass }, outputExpressions : SelectOutputExpression[], rows : any[]) : TDataClass[] {
	const convertedRows = rows.map((row) => mapRowToClass(clz, outputExpressions, row));
	const nestedSchema = extractNestedSchema(outputExpressions);
	if (nestedSchema.nested.size > 0) {
		return mergeNested(convertedRows, nestedSchema);
	} else {
		return convertedRows;
	}
}

class NestedSchema {
	values : string[] = [];
	nested : DefaultMap<string, NestedSchema> = new DefaultMap<string, NestedSchema>(() => new NestedSchema());
}

function extractNestedSchema(outputExpressions : SelectOutputExpression[]) : NestedSchema {
	const output = new NestedSchema();
	for (const expr of outputExpressions) {
		switch (expr.type) {
			case "aliasedExpressionNode":
				let segment = output;
				for (let i = 0; i < expr.aliasPath.length - 1; i++) {
					const part = expr.aliasPath[i];
					segment = segment.nested.get(part);
				}
				segment.values.push(last(expr.aliasPath));
				break;
			default:
				break;
		}
	}
	logObject(output);
	return output;
}
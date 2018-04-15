import {SelectOutputExpression} from "../query/ast";
import {RowMappingError, UnsupportedOperationError} from "../errors";
import {assertNever, DefaultMap, isMap, last, logObject, SettingMap} from "../lang";
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
		nestedObject = {};
		(<any> output)[arrayKey] = arr;
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

		case "binaryOperationNode":
		case "columnReferenceNode":
		case "constantNode":
		case "functionExpressionNode":
		case "literalNode":
		case "naturalSyntaxFunctionExpressionNode":
		case "subSelectNode":
		case "unaryOperationNode":
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

export function mapRowToClass<TDataClass = never>(outputExpressions : SelectOutputExpression[], row : any) : TDataClass {
	const output = {};

	for (const expr of outputExpressions) {
		processOutputExpression(expr, row, output);
	}
	return output as TDataClass;
}

function hashRow<TDataClass>(row : TDataClass, propertiesToHash : string[]) : string {
	const hash = new MetroHash128(HASH_SEED);
	for (const key of propertiesToHash) {
		hash.update(`${ key }=${ (<any> row)[key] };`);
	}
	return hash.digest();
}

type NestedObject = any;

/**
 * Select statements can contain values from multiple tables, and are not limited to primary keys of those tables.
 * The only way to distinguish rows is to hash all the non-nested values.
 */
function mergeNested(objects : NestedObject[], nestedSchema : NestedSchema, hashMap : SettingMap<string, any>) : void {
	for (const obj of objects) {
		const hash = hashRow(obj, nestedSchema.values);
		const objToUpdate = hashMap.getOrSet(hash, obj);
		for (const [key, value] of nestedSchema.nested.entries()) {
			let propertyValue = obj[key];
			let nestedMap = objToUpdate[key];
			if (!isMap(nestedMap)) {
				nestedMap = new SettingMap<string, any>();
				objToUpdate[key] = nestedMap;
			}
			mergeNested(propertyValue, value, nestedMap);
		}
	}
}

function convertMapsToArrays(hashMap : SettingMap<string, any>, nestedSchema : NestedSchema) : any[] {
	const output = [];
	for (const obj of hashMap.values()) {
		for (const [key, value] of nestedSchema.nested.entries()) {
			obj[key] = convertMapsToArrays(obj[key], value);
		}
		output.push(obj);
	}
	return output;
}

export function mapRowsToClass<TDataClass>(outputExpressions : SelectOutputExpression[], rows : NestedObject[]) : TDataClass[] {
	const convertedRows = rows.map((row) => mapRowToClass(outputExpressions, row));
	const nestedSchema = extractNestedSchema(outputExpressions);
	if (nestedSchema.nested.size > 0) {
		const hashMap = new SettingMap<string, any>();
		mergeNested(convertedRows, nestedSchema, hashMap);
		return convertMapsToArrays(hashMap, nestedSchema);
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
	// logObject(output);
	return output;
}
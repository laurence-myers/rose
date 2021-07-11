import { SelectOutputExpression } from "../query/ast";
import { RowMappingError, UnsupportedOperationError } from "../errors";
import { DefaultMap, isMap, last, SettingMap } from "../lang";
import { MappedQuerySelector, QueryOutput } from "../query/typeMapping";
import { QuerySelector } from "../query/querySelector";
import { defaultRowHasher } from "./rowHasher";

interface Aliases {
	input: string;
	output: string;
}

interface NestedPathResult {
	nestedObject: any;
	key: string;
}

function processNestedPathSegment(arrayKey: string, output: any) {
	let nestedObject: any;
	if (!(<any>output)[arrayKey]) {
		const arr: any[] = [];
		nestedObject = {};
		(<any>output)[arrayKey] = arr;
		arr.push(nestedObject);
	} else {
		nestedObject = (<any>output)[arrayKey][0];
	}
	return nestedObject;
}

function processNestedPath(
	allSegments: string[],
	output: any
): NestedPathResult {
	const segments = allSegments.slice(0, allSegments.length - 1);
	const nestedObject = segments.reduce((nestedObject: any, segment: string) => {
		return processNestedPathSegment(segment, nestedObject);
	}, output);
	return {
		key: allSegments[allSegments.length - 1],
		nestedObject,
	};
}

function processOutputExpression(
	expr: SelectOutputExpression,
	row: any,
	output: any,
	aliases?: Aliases
): void {
	switch (expr.type) {
		case "aliasedExpressionNode":
			if (expr.alias.path.length > 1) {
				const { key, nestedObject } = processNestedPath(
					expr.alias.path,
					output
				);
				processOutputExpression(expr.expression, row, nestedObject, {
					input: expr.alias.name,
					output: key,
				});
			} else {
				processOutputExpression(expr.expression, row, output, {
					input: expr.alias.name,
					output: expr.alias.name,
				});
			}
			break;

		default:
			if (!aliases || !aliases.input || !aliases.output) {
				throw new UnsupportedOperationError(
					"All output values must be aliased"
				);
			} else if (row[aliases.input] === undefined) {
				throw new RowMappingError(
					`Expected row to have a column named "${aliases.input}"`
				);
			} else {
				const outputKey = aliases.output;
				const inputKey = aliases.input;
				(<any>output)[outputKey] = row[inputKey];
			}
			break;
	}
}

export function mapRowToClass<T extends QuerySelector = never>(
	outputExpressions: SelectOutputExpression[],
	row: any
): QueryOutput<T> {
	const output = {};

	for (const expr of outputExpressions) {
		processOutputExpression(expr, row, output);
	}
	return output as QueryOutput<T>;
}

type NestedObject = any;

/**
 * Select statements can contain values from multiple tables, and are not limited to primary keys of those tables.
 * The only way to distinguish rows is to hash all the non-nested values.
 */
function mergeNested(
	objects: NestedObject[],
	parentNestedSchema: NestedSchema,
	hashMap: SettingMap<string, any>
): void {
	for (const obj of objects) {
		const hash = defaultRowHasher(obj, parentNestedSchema.parentValues);
		const objToUpdate = hashMap.getOrSet(hash, obj);
		for (const [key, value] of parentNestedSchema.nested.entries()) {
			const propertyValue = obj[key];
			let nestedMap = objToUpdate[key];
			if (!isMap(nestedMap)) {
				nestedMap = new SettingMap<string, any>();
				objToUpdate[key] = nestedMap;
			}
			mergeNested(propertyValue, value, nestedMap);
		}
	}
}

function convertMapsToArrays(
	hashMap: SettingMap<string, any>,
	nestedSchema: NestedSchema
): any[] {
	const output = [];
	for (const obj of hashMap.values()) {
		for (const [key, value] of nestedSchema.nested.entries()) {
			obj[key] = convertMapsToArrays(obj[key], value);
		}
		output.push(obj);
	}
	return output;
}

export function mapRowsToClass<T extends QuerySelector>(
	outputExpressions: SelectOutputExpression[],
	rows: NestedObject[]
): MappedQuerySelector<T>[] {
	const convertedRows = rows.map(
		(row): MappedQuerySelector<T> =>
			mapRowToClass<T>(outputExpressions, row) as MappedQuerySelector<T>
	);
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
	aliasPath: string[] = [];
	parentValues: string[] = [];
	nested: DefaultMap<string, NestedSchema> = new DefaultMap<
		string,
		NestedSchema
	>(() => new NestedSchema());
}

function extractNestedSchema(
	outputExpressions: SelectOutputExpression[]
): NestedSchema {
	const output = new NestedSchema();
	for (const expr of outputExpressions) {
		switch (expr.type) {
			case "aliasedExpressionNode": {
				let segment = output;
				for (let i = 0; i < expr.alias.path.length - 1; i++) {
					const part = expr.alias.path[i];
					segment = segment.nested.get(part);
					if (segment.aliasPath.length === 0) {
						segment.aliasPath = expr.alias.path.slice(
							0,
							expr.alias.path.length - 1
						);
					}
				}
				segment.parentValues.push(last(expr.alias.path));
				break;
			}
			default:
				break;
		}
	}
	return output;
}

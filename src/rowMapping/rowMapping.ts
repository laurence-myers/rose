import {SelectOutputExpression} from "../query/ast";
import {NotImplementedError} from "../errors";
import {assertNever} from "../lang";
import {getNestedPropertyNames} from "../query/metadata";
import * as crypto from "crypto";

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
		// TODO: support expressions / function results
		default:
			//assertNever(expr.type);
			throw new NotImplementedError(`Cannot map from output expression of type: "${ expr.type }"`);
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
	const hash = crypto.createHash('md5');
	for (const key in Object.keys(row)) {
		if (nestedPropertyNames.indexOf(key) == -1) { // TODO: replace the array lookup with a set
			hash.write(`${ key }=;${ (<any> row)[key] }`);
		}
	}
	return hash.digest().toString();
}

function mergeRows<TDataClass>(dst : TDataClass, src : TDataClass, nestedPropertyNames : string[]) : void {
	// Immutable version
	// return R.mergeWith(
	// 	R.concat,
	// 	dst,
	// 	R.pick(nestedPropertyNames, src)
	// );
	for (const propName of nestedPropertyNames) {
		(<any> dst)[propName] = (<any> dst)[propName].concat((<any> src)[propName])
	}
}

/**
 * Select statements can contain values from multiple tables, and are not limited to primary keys of those tables.
 * The only way to distinguish rows is to hash all the non-nested values.
 */
function mergeNestedRows<TDataClass>(convertedRows : TDataClass[], outputExpressions : SelectOutputExpression[], nestedPropertyNames : string[]) : TDataClass[] {
	const rowMap = new Map<string, TDataClass>();
	convertedRows.forEach((convertedRow) => {
		const hash = hashRow(convertedRow, nestedPropertyNames);
		let row = rowMap.get(hash);
		if (row) {
			mergeRows(row, convertedRow, nestedPropertyNames);
		} else {
			row = convertedRow;
			rowMap.set(hash, row);
		}
	});
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

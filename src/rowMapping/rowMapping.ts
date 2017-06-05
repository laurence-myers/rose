import {SelectOutputExpression} from "../query/ast";
import {NotImplementedError} from "../errors";
import {assertNever} from "../lang";

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

export function mapRowsToClass<TDataClass>(clz : { new() : TDataClass }, outputExpressions : SelectOutputExpression[], rows : any[]) : TDataClass[] {
	// TODO: "reduce" multiple rows for the same aggregate root
	return rows.map((row) => mapRowToClass(clz, outputExpressions, row));
}

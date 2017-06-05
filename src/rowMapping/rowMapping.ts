import {SelectOutputExpression} from "../query/ast";
import {NotImplementedError} from "../errors";
import {assertNever} from "../lang";

interface Aliases {
	input : string;
	output : string;
}

function processOutputExpression<TDataClass>(expr : SelectOutputExpression, row : any, output : TDataClass, aliases? : Aliases) : void {
	switch (expr.type) {
		case "aliasedExpressionNode":
			if (expr.alias.indexOf('.') > -1) {
				const segments = expr.alias.split('.');
				const arrayKey = segments[0];
				const arr : any[] = [];
				(<any> output)[arrayKey] = arr;
				// TODO: support deeply nested joins
				// TODO: support multiple rows
				// TODO: support multiple properties
				const propKey = segments[1];
				const nestedObject : any = {};
				processOutputExpression(expr.expression, row, nestedObject, {
					input: expr.alias,
					output: propKey
				});
				arr.push(nestedObject);
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
		// TODO: support nested queries
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
	return rows.map((row) => mapRowToClass(clz, outputExpressions, row));
}

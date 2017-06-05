import {SelectOutputExpression} from "../query/ast";
import {NotImplementedError} from "../errors";
import {assertNever} from "../lang";

function processOutputExpression<TDataClass>(expr : SelectOutputExpression, row : any, output : TDataClass, alias? : string) : void {
	switch (expr.type) {
		case "aliasedExpressionNode":
			processOutputExpression(expr.expression, row, output, expr.alias);
			break;
		case "columnReferenceNode":
			// TODO: verify that the key exists in the row
			const key = alias || expr.columnName;
			(<any> output)[key] = row[key];
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

import {ValueExpressionNode, FunctionExpressionNode} from "../ast";

export function count(valueExpression? : ValueExpressionNode) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : []
	};
}

// String functions

// TODO: assert that only expressions returning strings are allowed.
export function lower(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'lower',
		arguments: [valueExpression]
	};
}

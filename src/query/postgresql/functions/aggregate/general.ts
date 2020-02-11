import { FunctionExpressionNode, ParameterOrValueExpressionNode } from "../../../ast";
import { literal } from "../../../dsl/core";

export function count(valueExpression? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : [literal('*')]
	};
}

export function sum(valueExpression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'sum',
		arguments: [valueExpression]
	};
}

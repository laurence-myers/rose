import {ValueExpressionNode, FunctionExpressionNode} from "../ast";

export function count(valueExpression? : ValueExpressionNode) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : []
	};
}
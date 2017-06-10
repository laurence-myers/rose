import {FunctionExpressionNode, ValueExpressionNode} from "../ast";
import {literal} from "../dsl";

export function count(valueExpression? : ValueExpressionNode) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : [literal('*')]
	};
}

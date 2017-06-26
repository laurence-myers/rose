import {FunctionExpressionNode, ParameterOrValueExpressionNode} from "../../../ast";
import {literal} from "../../../dsl";

export function count(valueExpression? : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : [literal('*')]
	};
}

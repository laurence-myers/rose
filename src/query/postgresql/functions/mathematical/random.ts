import {createFunctionNode} from "../common/helpers";
import {FunctionExpressionNode, ParameterOrValueExpressionNode} from "../../../ast";

export function random() : FunctionExpressionNode {
	return createFunctionNode('random');
}

export function setseed(valueExpression : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('setseed', valueExpression);
}

import {createFunctionNode} from "../common/helpers";
import {FunctionExpressionNode, ValueExpressionNode} from "../../../ast";

export function random() : FunctionExpressionNode {
	return createFunctionNode('random');
}

export function setseed(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('setseed', valueExpression);
}

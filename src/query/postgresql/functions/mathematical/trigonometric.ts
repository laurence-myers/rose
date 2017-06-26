import {createFunctionNode} from "../common/helpers";
import {FunctionExpressionNode, ParameterOrValueExpressionNode} from "../../../ast";

export function acos(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('acos', x);
}

export function asin(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('asin', x);
}

export function atan(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('atan', x);
}

export function atan2(y : ParameterOrValueExpressionNode, x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('atan2', y, x);
}

export function cos(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('cos', x);
}

export function cot(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('cot', x);
}

export function sin(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('sin', x);
}

export function tan(x : ParameterOrValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('tan', x);
}

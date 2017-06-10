import {createFunctionNode} from "../common/helpers";
import {FunctionExpressionNode, ValueExpressionNode} from "../../../ast";

export function acos(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('acos', x);
}

export function asin(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('asin', x);
}

export function atan(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('atan', x);
}

export function atan2(y : ValueExpressionNode, x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('atan2', y, x);
}

export function cos(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('cos', x);
}

export function cot(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('cot', x);
}

export function sin(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('sin', x);
}

export function tan(x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('tan', x);
}

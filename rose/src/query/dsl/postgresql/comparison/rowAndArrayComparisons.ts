import {
	FunctionExpressionNode,
	ParameterOrValueExpressionNode,
} from "../../../ast";
import { createFunctionNode } from "../common";

export function all(
	expr: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ALL", expr);
}

export function any(
	expr: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ANY", expr);
}

export const some = any;

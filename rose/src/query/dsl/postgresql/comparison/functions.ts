import { ParameterOrValueExpressionNode } from "../../../ast";
import { createFunctionNode } from "../common";

export function num_nonnulls(...args: ParameterOrValueExpressionNode[]) {
	return createFunctionNode('num_nonnulls', ...args);
}

export function num_nulls(...args: ParameterOrValueExpressionNode[]) {
	return createFunctionNode('num_nulls', ...args);
}

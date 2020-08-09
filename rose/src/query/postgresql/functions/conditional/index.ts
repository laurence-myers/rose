import { FunctionExpressionNode, ParameterOrValueExpressionNode } from "../../../ast";
import { createFunctionNode } from "../common";

export function coalesce(first: ParameterOrValueExpressionNode, ...rest: ParameterOrValueExpressionNode[]): FunctionExpressionNode {
    return createFunctionNode('COALESCE', first, ...rest);
}

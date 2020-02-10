import {FunctionExpressionNode, ParameterOrValueExpressionNode} from "../../../ast";
import {createFunctionNode} from "../common/helpers";

/**
 * Not technically a function, but the syntax is similar enough that I'm going to treat it like one. So there! :P
 */
export function all(expr: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('ALL', expr);
}

/**
 * Not technically a function, but the syntax is similar enough that I'm going to treat it like one. So there! :P
 */
export function any(expr: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('ANY', expr);
}
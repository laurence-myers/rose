import {
	 BooleanBinaryOperationNode, ExpressionListNode, FunctionExpressionNode
} from "../../../ast";
import { createFunctionNode } from "../common/helpers";
/**
 * Current date and time (start of current transaction); see Section 9.9.4
 */
export function now(): FunctionExpressionNode {
	return createFunctionNode('now');
}

export function overlaps(left: ExpressionListNode, right: ExpressionListNode): BooleanBinaryOperationNode {
	return {
		type: 'binaryOperationNode',
		left,
		right,
		operator: "OVERLAPS"
	};
}
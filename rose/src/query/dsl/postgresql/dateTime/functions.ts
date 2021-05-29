import { BooleanBinaryOperationNode, FunctionExpressionNode, ParameterOrValueExpressionNode } from "../../../ast";
import { createFunctionNode } from "../common/helpers";

/**
 * Current date and time (start of current transaction); see Section 9.9.4
 */
export function now(): FunctionExpressionNode {
	return createFunctionNode('now');
}

export function overlaps(
	start1: ParameterOrValueExpressionNode,
	endOrLength1: ParameterOrValueExpressionNode,
	start2: ParameterOrValueExpressionNode,
	endOrLength2: ParameterOrValueExpressionNode
): BooleanBinaryOperationNode {
	return {
		type: 'binaryOperationNode',
		left: {
			type: "expressionListNode",
			expressions: [start1, endOrLength1]
		},
		right: {
			type: "expressionListNode",
			expressions: [start2, endOrLength2]
		},
		operator: "OVERLAPS"
	};
}

import {
	createBinaryOperatorNode,
	createBooleanBinaryOperatorNode,
} from "../common";
import { ParameterOrValueExpressionNode } from "../../../ast";

/**
 * Does the first array contain the second, that is, does each element appearing in the second array equal some element of the first array? (Duplicates are not treated specially, thus ARRAY[1] and ARRAY[1,1] are each considered to contain the other.)
 */
export function arrayContains(
	left: ParameterOrValueExpressionNode,
	right: ParameterOrValueExpressionNode
) {
	return createBooleanBinaryOperatorNode("@>", left, right);
}

/**
 * Is the first array contained by the second?
 */
export function arrayIsContainedBy(
	left: ParameterOrValueExpressionNode,
	right: ParameterOrValueExpressionNode
) {
	return createBooleanBinaryOperatorNode("<@", left, right);
}

/**
 * Do the arrays overlap, that is, have any elements in common?
 */
export function arraysOverlap(
	left: ParameterOrValueExpressionNode,
	right: ParameterOrValueExpressionNode
) {
	return createBooleanBinaryOperatorNode("&&", left, right);
}

/**
 * Concatenates an element onto the front of an array (which must be empty or one-dimensional).
 * or
 * Concatenates an element onto the end of an array (which must be empty or one-dimensional).
 */
export function concatenateArray(
	left: ParameterOrValueExpressionNode,
	right: ParameterOrValueExpressionNode
) {
	return createBinaryOperatorNode("||", left, right);
}

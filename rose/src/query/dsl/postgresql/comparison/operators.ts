import { ParameterOrValueExpressionNode } from "../../../ast";
import { createBooleanBinaryOperatorNode } from "../common";

export function equal(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('=', left, right);
}

export const eq = equal;

export function greaterThan(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('>', left, right);
}

export const gt = greaterThan;

export function greaterThanOrEqual(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('>=', left, right);
}

export const gte = greaterThanOrEqual;

export function lessThan(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('<', left, right);
}

export const lt = lessThan;

export function lessThanOrEqual(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('<=', left, right);
}

export const lte = lessThanOrEqual;

export function notEqual(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('!=', left, right);
}

export const neq = notEqual;

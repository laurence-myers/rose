import { ParameterOrValueExpressionNode } from "../../../ast";
import {
	createBooleanBinaryOperatorNode,
	createBooleanUnaryOperatorNode,
	createNaturalSyntaxFunctionNode,
} from "../common";

export function between(
	value: ParameterOrValueExpressionNode,
	start: ParameterOrValueExpressionNode,
	end: ParameterOrValueExpressionNode
) {
	return createNaturalSyntaxFunctionNode(
		undefined,
		[
			{
				value,
			},
			{
				key: "BETWEEN",
				value: start,
			},
			{
				key: "AND",
				value: end,
			},
		],
		true
	);
}

export function betweenSymmetric(
	value: ParameterOrValueExpressionNode,
	start: ParameterOrValueExpressionNode,
	end: ParameterOrValueExpressionNode
) {
	return createNaturalSyntaxFunctionNode(
		undefined,
		[
			{
				value,
			},
			{
				key: "BETWEEN SYMMETRIC",
				value: start,
			},
			{
				key: "AND",
				value: end,
			},
		],
		true
	);
}

export function isDistinctFrom(
	value: ParameterOrValueExpressionNode,
	other: ParameterOrValueExpressionNode
) {
	return createBooleanBinaryOperatorNode("IS DISTINCT FROM", value, other);
}

export function isFalse(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS FALSE", "right", value);
}

export function isNotDistinctFrom(
	value: ParameterOrValueExpressionNode,
	other: ParameterOrValueExpressionNode
) {
	return createBooleanBinaryOperatorNode("IS NOT DISTINCT FROM", value, other);
}

export function isNotFalse(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS NOT FALSE", "right", value);
}

export function isNotNull(value: ParameterOrValueExpressionNode) {
	return createBooleanUnaryOperatorNode("IS NOT NULL", "right", value);
}

export function isNotTrue(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS NOT TRUE", "right", value);
}

export function isNotUnknown(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS NOT UNKNOWN", "right", value);
}

export function isNull(value: ParameterOrValueExpressionNode) {
	return createBooleanUnaryOperatorNode("IS NULL", "right", value);
}

export function isTrue(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS TRUE", "right", value);
}

export function isUnknown(value: ParameterOrValueExpressionNode<boolean>) {
	return createBooleanUnaryOperatorNode("IS UNKNOWN", "right", value);
}

export function notBetween(
	value: ParameterOrValueExpressionNode,
	start: ParameterOrValueExpressionNode,
	end: ParameterOrValueExpressionNode
) {
	return createNaturalSyntaxFunctionNode(
		undefined,
		[
			{
				value,
			},
			{
				key: "NOT BETWEEN",
				value: start,
			},
			{
				key: "AND",
				value: end,
			},
		],
		true
	);
}

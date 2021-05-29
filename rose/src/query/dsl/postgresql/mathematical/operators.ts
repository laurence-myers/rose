import { createBinaryOperatorNode, createUnaryOperatorNode } from "../common/helpers";
import { BinaryOperationNode, UnaryOperationNode, ParameterOrValueExpressionNode } from "../../../ast";

export function add(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('+', left, right);
}

export function subtract(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('-', left, right);
}

export function multiply(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('*', left, right);
}

export function divide(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('/', left, right);
}

export function modulo(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('%', left, right);
}

export function exponentiate(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('^', left, right);
}

export function squareRoot(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('|/', left, right);
}

export function cubeRoot(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('||/', left, right);
}

export function factorial(expression: ParameterOrValueExpressionNode): UnaryOperationNode {
	return createUnaryOperatorNode('!', "right", expression);
}

export function absolute(expression: ParameterOrValueExpressionNode): UnaryOperationNode {
	return createUnaryOperatorNode('@', "left", expression);
}

export function bitwiseAnd(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('&', left, right);
}

export function bitwiseOr(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('|', left, right);
}

export function bitwiseXor(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('#', left, right);
}

export function bitwiseNot(expression: ParameterOrValueExpressionNode): UnaryOperationNode {
	return createUnaryOperatorNode('~', "left", expression);
}

export function bitwiseShiftLeft(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('<<', left, right);
}

export function bitwiseShiftRight(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('>>', left, right);
}

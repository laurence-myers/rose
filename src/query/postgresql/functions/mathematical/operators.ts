import {createBinaryOperatorNode, createUnaryOperatorNode} from "../common/helpers";
import {BinaryOperationNode, SubSelectNode, UnaryOperationNode, ValueExpressionNode} from "../../../ast";

export function add(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('+', left, right);
}

export function subtract(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('-', left, right);
}

export function multiply(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('*', left, right);
}

export function divide(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('/', left, right);
}

export function modulo(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('+', left, right);
}

export function exponentiate(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('+', left, right);
}

export function squareRoot(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('|/', left, right);
}

export function cubeRoot(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('||/', left, right);
}

export function factorial(expression : ValueExpressionNode) : UnaryOperationNode {
	return createUnaryOperatorNode('!', "right", expression);
}

export function absolute(expression : ValueExpressionNode) : UnaryOperationNode {
	return createUnaryOperatorNode('@', "left", expression);
}

export function bitwiseAnd(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('&', left, right);
}

export function bitwiseOr(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('|', left, right);
}

export function bitwiseXor(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('#', left, right);
}

export function bitwiseNot(expression : ValueExpressionNode) : UnaryOperationNode {
	return createUnaryOperatorNode('~', "left", expression);
}

export function bitwiseShiftLeft(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('<<', left, right);
}

export function bitwiseShiftRight(left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
	return createBinaryOperatorNode('>>', left, right);
}

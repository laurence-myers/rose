import {
	BinaryOperationNode, ExpressionListNode,
	FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode, NaturalSyntaxFunctionExpressionNodeArgument,
	SubSelectNode, UnaryOperationNode,
	ValueExpressionNode
} from "../../../ast";

export function createUnaryOperatorNode(operator : string, position : "left" | "right", expression : ValueExpressionNode | SubSelectNode) : UnaryOperationNode {
	return {
		type: 'unaryOperationNode',
		expression,
		position,
		operator
	};
}

export function createBinaryOperatorNode(operator : string, left : ValueExpressionNode | SubSelectNode | ExpressionListNode, right : ValueExpressionNode | SubSelectNode | ExpressionListNode) : BinaryOperationNode {
	return {
		type: 'binaryOperationNode',
		left,
		right,
		operator
	};
}

export function createFunctionNode(name : string, ...args : ValueExpressionNode[]) : FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: name,
		arguments: args
	};
}

export function createNaturalSyntaxFunctionNode(name : string, keywords : NaturalSyntaxFunctionExpressionNodeArgument[]) : NaturalSyntaxFunctionExpressionNode {
	return {
		type: 'naturalSyntaxFunctionExpressionNode',
		name: name,
		arguments: keywords
	};
}
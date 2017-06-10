import {
	BinaryOperationNode,
	FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode, NaturalSyntaxFunctionExpressionNodeArgument,
	SubSelectNode, UnaryOperationNode,
	ValueExpressionNode
} from "../../../ast";

export function createUnaryOperatorNode(operator : string, position : "left" | "right", expression : ValueExpressionNode) : UnaryOperationNode {
	return {
		type: 'unaryOperationNode',
		expression,
		position,
		operator
	};
}

export function createBinaryOperatorNode(operator : string, left : ValueExpressionNode | SubSelectNode, right : ValueExpressionNode | SubSelectNode) : BinaryOperationNode {
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
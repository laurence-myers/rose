import {
	BinaryOperationNode, ExpressionListNode,
	FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode, NaturalSyntaxFunctionExpressionNodeArgument,
	 UnaryOperationNode,
	ParameterOrValueExpressionNode
} from "../../../ast";

export function createUnaryOperatorNode(operator: string, position: "left" | "right", expression: ParameterOrValueExpressionNode): UnaryOperationNode {
	return {
		type: 'unaryOperationNode',
		expression,
		position,
		operator
	};
}

export function createBinaryOperatorNode(operator: string, left: ParameterOrValueExpressionNode | ExpressionListNode, right: ParameterOrValueExpressionNode | ExpressionListNode): BinaryOperationNode {
	return {
		type: 'binaryOperationNode',
		left,
		right,
		operator
	};
}

export function createFunctionNode(name: string, ...args: ParameterOrValueExpressionNode[]): FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: name,
		arguments: args
	};
}

export function createNaturalSyntaxFunctionNode(name: string, keywords: NaturalSyntaxFunctionExpressionNodeArgument[]): NaturalSyntaxFunctionExpressionNode {
	return {
		type: 'naturalSyntaxFunctionExpressionNode',
		name: name,
		arguments: keywords
	};
}
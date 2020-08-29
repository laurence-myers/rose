import {
	BinaryOperationNode,
	BooleanBinaryOperationNode,
	BooleanUnaryOperationNode,
	ExpressionListNode,
	FunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNodeArgument,
	ParameterOrValueExpressionNode,
	UnaryOperationNode
} from "../../../ast";

export function createBooleanUnaryOperatorNode(operator: BooleanUnaryOperationNode['operator'], position: "left" | "right", expression: ParameterOrValueExpressionNode): BooleanUnaryOperationNode {
	return {
		type: 'unaryOperationNode',
		expression,
		position,
		operator
	};
}

export function createUnaryOperatorNode(operator: string, position: "left" | "right", expression: ParameterOrValueExpressionNode): UnaryOperationNode {
	return {
		type: 'unaryOperationNode',
		expression,
		position,
		operator
	};
}

export function createBooleanBinaryOperatorNode(operator: BooleanBinaryOperationNode['operator'], left: ParameterOrValueExpressionNode | ExpressionListNode, right: ParameterOrValueExpressionNode | ExpressionListNode): BooleanBinaryOperationNode {
	return {
		type: 'binaryOperationNode',
		left,
		right,
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

export function createNaturalSyntaxFunctionNode(name: string, keywords: NaturalSyntaxFunctionExpressionNodeArgument[], omitParentheses?: boolean): NaturalSyntaxFunctionExpressionNode {
	return {
		type: 'naturalSyntaxFunctionExpressionNode',
		name: name,
		arguments: keywords,
		omitParentheses
	};
}

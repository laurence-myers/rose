import {
	FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode, NaturalSyntaxFunctionExpressionNodeArgument,
	ValueExpressionNode
} from "../../../ast";

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
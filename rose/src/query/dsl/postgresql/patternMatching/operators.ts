import {
	BooleanBinaryOperationNode,
	NaturalSyntaxFunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNodeArgument,
	ParameterOrValueExpressionNode
} from "../../../ast";
import { createBooleanBinaryOperatorNode, createNaturalSyntaxFunctionNode } from "../common";
import { constant } from "../../index";

function createLikeNode(operator: 'LIKE' | 'ILIKE' | 'NOT LIKE' | 'NOT ILIKE', value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, escapeCharacter: string | undefined): NaturalSyntaxFunctionExpressionNode {
	const keywords: NaturalSyntaxFunctionExpressionNodeArgument[] = [
		{
			value: createBooleanBinaryOperatorNode(operator, value, pattern)
		},
	];

	if (escapeCharacter) {
		keywords.push({
			key: 'ESCAPE',
			value: constant(escapeCharacter),
		});
	}

	return createNaturalSyntaxFunctionNode(undefined, keywords, true);
}

export function like(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, escapeCharacter?: string): NaturalSyntaxFunctionExpressionNode {
	return createLikeNode('LIKE', value, pattern, escapeCharacter);
}

export function notLike(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, escapeCharacter?: string): NaturalSyntaxFunctionExpressionNode {
	return createLikeNode('NOT LIKE', value, pattern, escapeCharacter);
}

export function ilike(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, escapeCharacter?: string): NaturalSyntaxFunctionExpressionNode {
	return createLikeNode('ILIKE', value, pattern, escapeCharacter);
}

export function notIlike(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, escapeCharacter?: string): NaturalSyntaxFunctionExpressionNode {
	return createLikeNode('NOT ILIKE', value, pattern, escapeCharacter);
}

export function matchesRegexp(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode): BooleanBinaryOperationNode {
	return createBooleanBinaryOperatorNode('~', value, pattern);
}

export function notMatchesRegexp(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('!~', value, pattern);
}

export function matchesRegexpInsensitive(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('~*', value, pattern);
}

export function notMatchesRegexpInsensitive(value: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode) {
	return createBooleanBinaryOperatorNode('!~*', value, pattern);
}

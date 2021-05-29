import { createBinaryOperatorNode, createFunctionNode, createNaturalSyntaxFunctionNode } from "../common/helpers";
import {
	BinaryOperationNode,
	FunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNodeArgument,
	ParameterOrValueExpressionNode
} from "../../../ast";

/**
 * String concatenation
 * or
 * String concatenation with one non-string input
 */
export function concat(left: ParameterOrValueExpressionNode, right: ParameterOrValueExpressionNode): BinaryOperationNode {
	return createBinaryOperatorNode('||', left, right);
}

/**
 * Number of bits in string
 */
export function bit_length(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('bit_length', string);
}

/**
 * Number of characters in string
 */
export function char_length(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('char_length', string);
}

export const character_length = char_length;

/**
 * Convert string to lower case
 */
export function lower(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('lower', string);
}

/**
 * Number of bytes in string
 */
export function octet_length(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('octet_length', string);
}

/**
 * Replace substring
 * overlay('Txxxxas' placing 'hom' from 2 for 4)
 */
export function overlay(string: ParameterOrValueExpressionNode, placing: ParameterOrValueExpressionNode, from: ParameterOrValueExpressionNode, forNum? : ParameterOrValueExpressionNode): NaturalSyntaxFunctionExpressionNode {
	const args = [
		{
			value: string
		},
		{
			key: 'placing',
			value: placing
		},
		{
			key: 'from',
			value: from
		}
	];
	if (forNum !== undefined) {
		args.push({
			key: 'for',
			value: forNum
		});
	}
	return createNaturalSyntaxFunctionNode('overlay', args);
}

/**
 * Location of specified substring
 */
export function position(substring: ParameterOrValueExpressionNode, string: ParameterOrValueExpressionNode): NaturalSyntaxFunctionExpressionNode {
	return createNaturalSyntaxFunctionNode('position', [
		{
			value: substring
		},
		{
			key: 'in',
			value: string
		}
	]);
}

/**
 * Extract substring
 * or
 * Extract substring matching POSIX regular expression. See Section 9.7 for more information on pattern matching.
 */
export function substring(string: ParameterOrValueExpressionNode, from: ParameterOrValueExpressionNode, forExpr: ParameterOrValueExpressionNode): NaturalSyntaxFunctionExpressionNode {
	const args = [
		{
			value: string
		},
		{
			key: 'from',
			value: from
		}
	];
	if (forExpr !== undefined) {
		args.push({
			key: 'for',
			value: forExpr
		});
	}
	return createNaturalSyntaxFunctionNode('substring', args);
}

/**
 * Remove the longest string containing only the characters (a space by default) from the start/end/both ends of the string
 * NOTE: the order of arguments is different to the PostgreSQL function; "characters" is last, because it is optional.
 */
export function trim(where: 'leading' | 'trailing' | 'both', from: ParameterOrValueExpressionNode, characters? : ParameterOrValueExpressionNode): NaturalSyntaxFunctionExpressionNode {
	const args: NaturalSyntaxFunctionExpressionNodeArgument[] = [
		{
			value: {
				type: "constantNode",
				getter: () => where
			}
		}
	];
	if (characters !== undefined) {
		args.push({
			value: characters
		});
	}
	args.push({
		key: 'from',
		value: from
	});
	return createNaturalSyntaxFunctionNode('trim', args);
}

/**
 * Convert string to upper case
 */
export function upper(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('upper', string);
}

import { FunctionExpressionNode, ParameterOrValueExpressionNode } from "../../../ast";
import { literal } from "../../core";
import { createFunctionNode } from "../common";

/**
 * input values, including nulls, concatenated into an array
 * or
 * input arrays concatenated into array of one higher dimension (inputs must all have same dimensionality, and cannot be empty or null)
 */
export function array_agg(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('array_agg', expression);
}

/**
 * the average (arithmetic mean) of all non-null input values
 */
export function avg(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('avg', expression);
}

/**
 * the bitwise AND of all non-null input values, or null if none
 */
export function bit_and(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('bit_and', expression);
}

/**
 * the bitwise OR of all non-null input values, or null if none
 */
export function bit_or(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('bit_or', expression);
}

/**
 * true if all input values are true, otherwise false
 */
export function bool_and(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('bool_and', expression);
}

/**
 * true if at least one input value is true, otherwise false
 */
export function bool_or(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('bool_or', expression);
}

/**
 * number of input rows
 * or
 * number of input rows for which the value of expression is not null
 */
export function count(valueExpression?: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'count',
		arguments: valueExpression ? [valueExpression] : [literal('*')]
	};
}

/**
 * equivalent to bool_and
 */
export function every(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('every', expression);
}

/**
 * aggregates values, including nulls, as a JSON array
 */
export function json_agg(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('json_agg', expression);
}

/**
 * aggregates values, including nulls, as a JSON array
 */
export function jsonb_agg(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('jsonb_agg', expression);
}

/**
 * aggregates name/value pairs as a JSON object; values can be null, but not names
 */
export function json_object_agg(name: ParameterOrValueExpressionNode, value: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('json_object_agg', name, value);
}

/**
 * aggregates name/value pairs as a JSON object; values can be null, but not names
 */
export function jsonb_object_agg(name: ParameterOrValueExpressionNode, value: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('jsonb_object_agg', name, value);
}

/**
 * maximum value of expression across all non-null input values
 */
export function max(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('max', expression);
}

/**
 * minimum value of expression across all non-null input values
 */
export function min(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('min', expression);
}

/**
 * non-null input values concatenated into a string, separated by delimiter
 */
export function string_agg(expression: ParameterOrValueExpressionNode, delimiter: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('string_agg', expression, delimiter);
}

/**
 * sum of expression across all non-null input values
 */
export function sum(valueExpression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return {
		type: 'functionExpressionNode',
		name: 'sum',
		arguments: [valueExpression]
	};
}

/**
 * concatenation of non-null XML values (see also Section 9.14.1.7)
 */
export function xmlagg(expression: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('xmlagg', expression);
}

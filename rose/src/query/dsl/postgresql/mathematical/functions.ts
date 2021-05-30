import {
	FunctionExpressionNode,
	ParameterOrValueExpressionNode,
} from "../../../ast";
import { createFunctionNode } from "../common/helpers";

/**
 * absolute value
 */
export function abs(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("abs", valueExpression);
}

/**
 * cube root
 */
export function cbrt(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("cbrt", valueExpression);
}

/**
 * smallest integer not less than argument
 */
export function ceil(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ceil", valueExpression);
}

/**
 * smallest integer not less than argument (alias for ceil)
 */
export const ceiling = ceil;

/**
 * radians to degrees
 */
export function degrees(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("degrees", valueExpression);
}

/**
 * integer quotient of y/x
 */
export function div(
	y: ParameterOrValueExpressionNode,
	x: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("div", y, x);
}

/**
 * exponential
 */
export function exp(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("exp", valueExpression);
}

/**
 * largest integer not greater than argument
 */
export function floor(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("floor", valueExpression);
}

/**
 * natural logarithm
 */
export function ln(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ln", valueExpression);
}

/**
 * base 10 logarithm
 *
 * When second argument is provided:
 * logarithm to base b
 */
export function log(
	b: ParameterOrValueExpressionNode,
	x?: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	if (x !== undefined) {
		return createFunctionNode("log", b, x);
	} else {
		return createFunctionNode("log", b);
	}
}

/**
 * remainder of y/x
 */
export function mod(
	y: ParameterOrValueExpressionNode,
	x: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("mod", y, x);
}

/**
 * "π" constant
 */
export function pi(): FunctionExpressionNode {
	return createFunctionNode("pi");
}

/**
 * a raised to the power of b
 */
export function power(
	a: ParameterOrValueExpressionNode,
	b: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("power", a, b);
}

/**
 * degrees to radians
 */
export function radians(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("radians", valueExpression);
}

/**
 * round to nearest integer
 * or
 * round to s decimal places
 */
export function round(
	v: ParameterOrValueExpressionNode,
	s?: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	if (s !== undefined) {
		return createFunctionNode("round", v, s);
	} else {
		return createFunctionNode("round", v);
	}
}

/**
 * sign of the argument (-1, 0, +1)
 */
export function sign(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("sign", valueExpression);
}

/**
 * square root
 */
export function sqrt(
	valueExpression: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("sqrt", valueExpression);
}

/**
 * truncate toward zero
 * or
 * truncate to s decimal places
 */
export function trunc(
	v: ParameterOrValueExpressionNode,
	s: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	if (s !== undefined) {
		return createFunctionNode("trunc", v, s);
	} else {
		return createFunctionNode("trunc", v);
	}
}

/**
 * return the bucket to which operand would be assigned in an equidepth histogram with count buckets, in the range b1 to b2
 */
export function width_bucket(
	op: ParameterOrValueExpressionNode,
	b1: ParameterOrValueExpressionNode,
	b2: ParameterOrValueExpressionNode,
	count: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("width_bucket", op, b1, b2, count);
}

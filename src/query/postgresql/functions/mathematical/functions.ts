import {FunctionExpressionNode, ValueExpressionNode} from "../../../ast";
import {createFunctionNode} from "../common/helpers";

/**
 * absolute value
 */
export function abs(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('abs', valueExpression);
}

/**
 * cube root
 */
export function cbrt(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('cbrt', valueExpression);
}

/**
 * smallest integer not less than argument
 */
export function ceil(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('ceil', valueExpression);
}

/**
 * smallest integer not less than argument (alias for ceil)
 */
export const ceiling = ceil;

/**
 * radians to degrees
 */
export function degrees(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('degrees', valueExpression);
}

/**
 * integer quotient of y/x
 */
export function div(y : ValueExpressionNode, x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('div', y, x);
}

/**
 * exponential
 */
export function exp(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('exp', valueExpression);
}

/**
 * largest integer not greater than argument
 */
export function floor(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('floor', valueExpression);
}

/**
 * natural logarithm
 */
export function ln(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('ln', valueExpression);
}

/**
 * base 10 logarithm
 *
 * When second argument is provided:
 * logarithm to base b
 */
export function log(b : ValueExpressionNode, x? : ValueExpressionNode) : FunctionExpressionNode {
	if (x !== undefined) {
		return createFunctionNode('log', b, x);
	} else {
		return createFunctionNode('log', b);
	}
}

/**
 * remainder of y/x
 */
export function mod(y : ValueExpressionNode, x : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('mod', y, x);
}

/**
 * "π" constant
 */
export function pi() : FunctionExpressionNode {
	return createFunctionNode('pi');
}

/**
 * a raised to the power of b
 */
export function power(a : ValueExpressionNode, b : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('power', a, b);
}

/**
 * degrees to radians
 */
export function radians(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('radians', valueExpression);
}

/**
 * round to nearest integer
 * or
 * round to s decimal places
 */
export function round(v : ValueExpressionNode, s? : ValueExpressionNode) : FunctionExpressionNode {
	if (s !== undefined) {
		return createFunctionNode('round', s);
	} else {
		return createFunctionNode('round', v);
	}
}

/**
 * sign of the argument (-1, 0, +1)
 */
export function sign(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('sign', valueExpression);
}

/**
 * square root
 */
export function sqrt(valueExpression : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('sqrt', valueExpression);
}

/**
 * truncate toward zero
 * or
 * truncate to s decimal places
 */
export function trunc(v : ValueExpressionNode, s : ValueExpressionNode) : FunctionExpressionNode {
	if (s !== undefined) {
		return createFunctionNode('trunc', s);
	} else {
		return createFunctionNode('trunc', v);
	}
}

/**
 * return the bucket to which operand would be assigned in an equidepth histogram with count buckets, in the range b1 to b2
 */
export function width_bucket(op : ValueExpressionNode, b1 : ValueExpressionNode, b2 : ValueExpressionNode, count : ValueExpressionNode) : FunctionExpressionNode {
	return createFunctionNode('width_bucket', op, b1, b2, count);
}

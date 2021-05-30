import {
	FunctionExpressionNode,
	ParameterOrValueExpressionNode,
} from "../../../ast";
import { createFunctionNode } from "../common/helpers";

/**
 * Not technically a function, but the syntax is similar enough that I'm going to treat it like one. So there! :P
 */
export function all(
	expr: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ALL", expr);
}

/**
 * Not technically a function, but the syntax is similar enough that I'm going to treat it like one. So there! :P
 */
export function any(
	expr: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("ANY", expr);
}

/**
 * append an element to the end of an array
 */
export function array_append(
	anyarray: ParameterOrValueExpressionNode,
	anyelement: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_append", anyarray, anyelement);
}

/**
 * concatenate two arrays
 */
export function array_cat(
	anyarray: ParameterOrValueExpressionNode,
	anyarray2: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_cat", anyarray, anyarray2);
}

/**
 * returns the number of dimensions of the array
 */
export function array_ndims(
	anyarray: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_ndims", anyarray);
}

/**
 * returns a text representation of array's dimensions
 */
export function array_dims(
	anyarray: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_dims", anyarray);
}

/**
 * returns an array initialized with supplied value and dimensions, optionally with lower bounds other than 1
 */
export function array_fill(
	anyelement: ParameterOrValueExpressionNode,
	values: ReadonlyArray<ParameterOrValueExpressionNode>,
	...valuesArrays: ReadonlyArray<ReadonlyArray<ParameterOrValueExpressionNode>>
): FunctionExpressionNode {
	return createFunctionNode(
		"array_fill",
		anyelement,
		...values.concat(...valuesArrays)
	);
}

/**
 * returns the length of the requested array dimension
 */
export function array_length(
	anyarray: ParameterOrValueExpressionNode,
	int: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_length", anyarray, int);
}

/**
 * returns lower bound of the requested array dimension
 */
export function array_lower(
	anyarray: ParameterOrValueExpressionNode,
	int: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_lower", anyarray, int);
}

/**
 * returns the subscript of the first occurrence of the second argument in the array, starting at the element indicated by the third argument or at the first element (array must be one-dimensional)
 */
export function array_position(
	anyarray: ParameterOrValueExpressionNode,
	anyelement: ParameterOrValueExpressionNode,
	int?: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode(
		"array_position",
		...[anyarray, anyelement].concat(int ?? [])
	);
}

/**
 * returns an array of subscripts of all occurrences of the second argument in the array given as first argument (array must be one-dimensional)
 */
export function array_positions(
	anyarray: ParameterOrValueExpressionNode,
	anyelement: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_positions", anyarray, anyelement);
}

/**
 * append an element to the beginning of an array
 */
export function array_prepend(
	anyelement: ParameterOrValueExpressionNode,
	anyarray: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_prepend", anyelement, anyarray);
}

/**
 * remove all elements equal to the given value from the array (array must be one-dimensional)
 */
export function array_remove(
	anyarray: ParameterOrValueExpressionNode,
	anyelement: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_remove", anyarray, anyelement);
}

/**
 * replace each array element equal to the given value with a new value
 */
export function array_replace(
	anyarray: ParameterOrValueExpressionNode,
	anyelement: ParameterOrValueExpressionNode,
	anyelement2: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_replace", anyarray, anyelement, anyelement2);
}

/**
 * concatenates array elements using supplied delimiter and optional null string
 */
export function array_to_string(
	anyarray: ParameterOrValueExpressionNode,
	delimiter: ParameterOrValueExpressionNode<string>,
	nullString?: ParameterOrValueExpressionNode<string>
): FunctionExpressionNode {
	return createFunctionNode(
		"array_to_string",
		...[anyarray, delimiter].concat(nullString ?? [])
	);
}

/**
 * returns upper bound of the requested array dimension
 */
export function array_upper(
	anyarray: ParameterOrValueExpressionNode,
	int: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("array_upper", anyarray, int);
}

/**
 * returns the total number of elements in the array, or 0 if the array is empty
 */
export function cardinality(
	anyarray: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("cardinality", anyarray);
}

/**
 * splits string into array elements using supplied delimiter and optional null string
 */
export function string_to_array(
	text: ParameterOrValueExpressionNode,
	delimiter: ParameterOrValueExpressionNode,
	nullString?: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode(
		"string_to_array",
		...[text, delimiter].concat(nullString ?? [])
	);
}

/**
 * expand an array to a set of rows
 */
export function unnest(
	anyarray: ParameterOrValueExpressionNode
): FunctionExpressionNode {
	return createFunctionNode("unnest", anyarray);
}

/**
 * expand multiple arrays (possibly of different types) to a set of rows. This is only allowed in the FROM clause; see Section 7.2.1.4
 */
export function unnestInFrom(
	anyarray: ParameterOrValueExpressionNode,
	anyarray2: ParameterOrValueExpressionNode,
	...arrayArrays: ReadonlyArray<ParameterOrValueExpressionNode>
): FunctionExpressionNode {
	return createFunctionNode("unnest", anyarray, anyarray2, ...arrayArrays);
}

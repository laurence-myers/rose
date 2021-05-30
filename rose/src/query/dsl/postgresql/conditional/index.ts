import {
	FunctionExpressionNode,
	ParameterOrValueExpressionNode,
} from "../../../ast";
import { createFunctionNode } from "../common";
import { MultiCaseBuilder, SimpleCaseBuilder } from "./case";

export function coalesce(
	first: ParameterOrValueExpressionNode,
	...rest: ParameterOrValueExpressionNode[]
): FunctionExpressionNode {
	return createFunctionNode("COALESCE", first, ...rest);
}

export function case_(): MultiCaseBuilder {
	return new MultiCaseBuilder();
}

export const caseMulti = case_;

export function caseSimple(
	expression: ParameterOrValueExpressionNode
): SimpleCaseBuilder {
	return new SimpleCaseBuilder(expression);
}

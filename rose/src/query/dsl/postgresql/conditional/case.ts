import {
	BooleanExpression,
	NaturalSyntaxFunctionExpressionNode,
	NaturalSyntaxFunctionExpressionNodeArgument,
	ParameterOrValueExpressionNode,
} from "../../../ast";
import { Clone } from "../../../../lang";
import { createNaturalSyntaxFunctionNode } from "../common";
import { literal } from "../../core";

export class MultiCaseBuilder {
	protected readonly cases: {
		when: BooleanExpression;
		then: ParameterOrValueExpressionNode;
	}[] = [];
	protected elseResult?: ParameterOrValueExpressionNode;

	constructor() {}

	@Clone()
	when(value: BooleanExpression, then: ParameterOrValueExpressionNode): this {
		this.cases.push({
			when: value,
			then,
		});
		return this;
	}

	@Clone()
	else(result: ParameterOrValueExpressionNode): this {
		this.elseResult = result;
		return this;
	}

	end(): NaturalSyntaxFunctionExpressionNode {
		const args: NaturalSyntaxFunctionExpressionNodeArgument[] = [];
		for (const case_ of this.cases) {
			args.push({
				key: "WHEN",
				value: case_.when,
			});
			args.push({
				key: "THEN",
				value: case_.then,
			});
		}
		if (this.elseResult) {
			args.push({
				key: "ELSE",
				value: this.elseResult,
			});
		}
		args.push({
			value: literal("END"),
		});
		return createNaturalSyntaxFunctionNode("CASE", args, true);
	}
}

export class SimpleCaseBuilder {
	protected readonly cases: {
		when: ParameterOrValueExpressionNode;
		then: ParameterOrValueExpressionNode;
	}[] = [];
	protected elseResult?: ParameterOrValueExpressionNode;

	constructor(protected readonly expression: ParameterOrValueExpressionNode) {}

	@Clone()
	when(
		value: ParameterOrValueExpressionNode,
		then: ParameterOrValueExpressionNode
	): this {
		this.cases.push({
			when: value,
			then,
		});
		return this;
	}

	@Clone()
	else(result: ParameterOrValueExpressionNode): this {
		this.elseResult = result;
		return this;
	}

	end(): NaturalSyntaxFunctionExpressionNode {
		const args: NaturalSyntaxFunctionExpressionNodeArgument[] = [
			{
				value: this.expression,
			},
		];
		for (const case_ of this.cases) {
			args.push({
				key: "WHEN",
				value: case_.when,
			});
			args.push({
				key: "THEN",
				value: case_.then,
			});
		}
		if (this.elseResult) {
			args.push({
				key: "ELSE",
				value: this.elseResult,
			});
		}
		args.push({
			value: literal("END"),
		});
		return createNaturalSyntaxFunctionNode("CASE", args, true);
	}
}

import {
	AliasedExpressionNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
	ConstantNode,
	ExpressionListNode,
	LiteralNode,
	NotExpressionNode,
	ParameterOrValueExpressionNode,
	TableReferenceNode
} from "../ast";
import { ColumnMetamodel } from "../metamodel";

export function aliasTable(tableName: string, alias: string): AliasedExpressionNode<TableReferenceNode> {
	return {
		type: 'aliasedExpressionNode',
		alias,
		aliasPath: [alias],
		expression: {
			type: 'tableReferenceNode',
			tableName: tableName,
		}
	};
}

export function and(first: BooleanExpression, second: BooleanExpression, ...rest: BooleanExpression[]): BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'and',
		expressions: [first, second].concat(rest)
	};
}

export function col(column: ColumnMetamodel<any>): ColumnReferenceNode {
	return column.toColumnReferenceNode();
}

export function constant(value: number | string): ConstantNode<number | string> {
	return {
		type: "constantNode",
		getter: () => value
	};
}

export function literal(value: string): LiteralNode {
	return {
		type: "literalNode",
		value
	};
}

export function not(expr: BooleanExpression): NotExpressionNode {
	return {
		type: 'notExpressionNode',
		expression: expr
	};
}

export function or(first: BooleanExpression, second: BooleanExpression, ...rest: BooleanExpression[]): BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'or',
		expressions: [first, second].concat(rest)
	};
}

export function param<P, R>(getter: (params: P) => R): ConstantNode<R> {
	return {
		type: "constantNode",
		getter: getter
	};
}

export class ParamsWrapper<P> {
	get<R>(getter: (params: P) => R): ConstantNode<R> {
		return param(getter);
	}
}

export function row(first: ParameterOrValueExpressionNode, ...rest: ParameterOrValueExpressionNode[]): ExpressionListNode {
	return {
		type: "expressionListNode",
		expressions: [first].concat(rest)
	};
}

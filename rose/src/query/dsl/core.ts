import {
	AliasedExpressionNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	CastNode,
	ColumnReferenceNode,
	ConstantNode,
	ExpressionListNode,
	LiteralNode,
	NotExpressionNode,
	ParameterOrValueExpressionNode,
	TableReferenceNode
} from "../ast";
import { ColumnMetamodel } from "../metamodel";

export function alias<TNode>(aliasedNode: TNode, alias: string): AliasedExpressionNode<TNode> {
	return {
		type: 'aliasedExpressionNode',
		alias,
		aliasPath: [alias],
		expression: aliasedNode
	};
}

export function aliasCol(aliasedNode: ColumnMetamodel<unknown>, alias: string): AliasedExpressionNode<ColumnReferenceNode> {
	return {
		type: 'aliasedExpressionNode',
		alias,
		aliasPath: [alias],
		expression: col(aliasedNode)
	};
}

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

export function cast(expression: ParameterOrValueExpressionNode, castType: string, requiresParentheses: boolean = false): CastNode {
	return {
		type: "castNode",
		castType,
		expression,
		requiresParentheses
	};
}

export function col(column: ColumnMetamodel<unknown>): ColumnReferenceNode {
	return column.toColumnReferenceNode();
}

export function constant<T extends number | string | boolean>(value: T): ConstantNode<T> {
	return {
		type: "constantNode",
		getter: (): T => value
	};
}

export function default_(): LiteralNode {
	return literal('DEFAULT');
}

export const dflt = default_;

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

export function null_(): LiteralNode {
	return literal('NULL');
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

export function row(first: ParameterOrValueExpressionNode, ...rest: ParameterOrValueExpressionNode[]): ExpressionListNode {
	return {
		type: "expressionListNode",
		expressions: [first].concat(rest)
	};
}

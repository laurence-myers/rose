import {
	AliasedExpressionNode,
	ArrayConstructorNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	CastNode,
	ColumnReferenceNode,
	ConstantNode,
	LiteralNode,
	NotExpressionNode,
	ParameterOrValueExpressionNode,
	RowConstructorNode,
	SubSelectNode,
	TableReferenceNode
} from "../ast";
import { ColumnMetamodel } from "../metamodel";
import { rectifyVariadicArgs } from "../../lang";

type SupportedConstant =
	| number
	| string
	| boolean
	| Buffer
	| null
	| ReadonlyArray<number>
	| ReadonlyArray<string>
	| ReadonlyArray<boolean>
	| ReadonlyArray<Buffer>
	| ReadonlyArray<null>;

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

export function and(first: BooleanExpression, second: BooleanExpression, ...rest: readonly BooleanExpression[]): BooleanExpressionGroupNode;
export function and(first: readonly BooleanExpression[]): BooleanExpressionGroupNode;
export function and(first: BooleanExpression | readonly BooleanExpression[], ...rest: readonly BooleanExpression[]): BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'and',
		expressions: rectifyVariadicArgs(first, rest)
	};
}

export function arrayConstructor(subQuery: SubSelectNode): ArrayConstructorNode;
export function arrayConstructor(...expressions: Exclude<ParameterOrValueExpressionNode, SubSelectNode>[]): ArrayConstructorNode;
export function arrayConstructor(...expressions: ParameterOrValueExpressionNode[]): ArrayConstructorNode {
	return {
		type: 'arrayConstructorNode',
		expressions
	};
}

export const array_ = arrayConstructor;

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

export function constant<T extends SupportedConstant>(value: T): ConstantNode<T> {
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

export function or(first: BooleanExpression, second: BooleanExpression, ...rest: readonly BooleanExpression[]): BooleanExpressionGroupNode;
export function or(first: readonly BooleanExpression[]): BooleanExpressionGroupNode;
export function or(first: BooleanExpression | readonly BooleanExpression[], ...rest: readonly BooleanExpression[]): BooleanExpressionGroupNode {
	return {
		type: 'booleanExpressionGroupNode',
		operator: 'or',
		expressions: rectifyVariadicArgs(first, rest)
	};
}

export function param<P, R>(getter: (params: P) => R): ConstantNode<R> {
	return {
		type: "constantNode",
		getter: getter
	};
}

export function row(values: readonly ParameterOrValueExpressionNode[]): RowConstructorNode;
export function row(first: ParameterOrValueExpressionNode, ...rest: readonly ParameterOrValueExpressionNode[]): RowConstructorNode;
export function row(first: ParameterOrValueExpressionNode | readonly ParameterOrValueExpressionNode[], ...rest: readonly ParameterOrValueExpressionNode[]): RowConstructorNode {
	return {
		type: "rowConstructorNode",
		expressionList: {
			type: "expressionListNode",
			expressions: rectifyVariadicArgs(first, rest)
		}
	};
}

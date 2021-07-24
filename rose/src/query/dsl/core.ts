import {
	AliasedExpressionNode,
	AliasNode,
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
	SubscriptNode,
	SubSelectNode,
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

export function alias(aliasName: string): AliasNode {
	return {
		type: "aliasNode",
		name: aliasName,
		path: [aliasName],
	};
}

/**
 * Assigns an alias to the given AST node.
 *
 * @category DSL - Core
 * @param aliasedNode The node to alias. This can be any type of AST node.
 * @param aliasName The name to use as the alias.
 */
export function aliasExpr<TNode>(
	aliasedNode: TNode,
	aliasName: string
): AliasedExpressionNode<TNode> {
	return {
		type: "aliasedExpressionNode",
		alias: alias(aliasName),
		expression: aliasedNode,
	};
}

/**
 * Assigns an alias to a column metamodel.
 *
 * This is a convenience function. The same functionality can be achieved by calling `alias(QMyTable.someColumn.col())`.
 *
 * @category DSL - Core
 * @param columnMetamodel The column metamodel to alias.
 * @param aliasName The name to use as the alias.
 * @see {@link alias}
 */
export function aliasCol(
	columnMetamodel: ColumnMetamodel<unknown>,
	aliasName: string
): AliasedExpressionNode<ColumnReferenceNode> {
	return {
		type: "aliasedExpressionNode",
		alias: alias(aliasName),
		expression: col(columnMetamodel),
	};
}

/**
 * Creates a boolean expression group, with each expression separated by "AND".
 *
 * @category DSL - Core
 * @param first The first boolean expression in the group.
 * @param second The second boolean expression in the group.
 * @param rest Any additional boolean expressions to include in the group.
 * @see https://www.postgresql.org/docs/13/functions-logical.html
 */
export function and(
	first: BooleanExpression,
	second: BooleanExpression,
	...rest: readonly BooleanExpression[]
): BooleanExpressionGroupNode;
/**
 * Creates a boolean expression group, with each expression separated by "AND".
 *
 * @category DSL - Core
 * @param first An array of boolean expressions in the group. Passing an array with less than two elements will
 *  generate invalid SQL.
 * @see https://www.postgresql.org/docs/13/functions-logical.html
 */
export function and(
	first: readonly BooleanExpression[]
): BooleanExpressionGroupNode;
export function and(
	first: BooleanExpression | readonly BooleanExpression[],
	...rest: readonly BooleanExpression[]
): BooleanExpressionGroupNode {
	return {
		type: "booleanExpressionGroupNode",
		operator: "and",
		expressions: rectifyVariadicArgs(first, rest),
	};
}

/**
 * Creates an array constructor expression from a subquery.
 *
 * @category DSL - Core
 * @param subQuery The subquery to convert into an array. The subquery must return a single column.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-SYNTAX-ARRAY-CONSTRUCTORS
 */
export function arrayConstructor(subQuery: SubSelectNode): ArrayConstructorNode;
/**
 * Creates an array constructor expression from zero or more expressions (excluding subqueries).
 *
 * @category DSL - Core
 * @param expressions The elements of the array.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-SYNTAX-ARRAY-CONSTRUCTORS
 */
export function arrayConstructor(
	...expressions: Exclude<ParameterOrValueExpressionNode, SubSelectNode>[]
): ArrayConstructorNode;
export function arrayConstructor(
	...expressions: ParameterOrValueExpressionNode[]
): ArrayConstructorNode {
	return {
		type: "arrayConstructorNode",
		expressions,
	};
}

/**
 * An alias for `arrayConstructor()`.
 *
 * Named to avoid conflicts with code dealing with JS arrays.
 *
 * @category DSL - Core
 * @see {@link arrayConstructor}
 */
export const array_ = arrayConstructor;

/**
 * Creates a type cast value expression.
 *
 * @category DSL - Core
 * @param expression The expression to cast.
 * @param castType The desired resulting type.
 * @param requiresParentheses Set to true to wrap `expression` in parentheses. Useful for complex expressions.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-SYNTAX-TYPE-CASTS
 */
export function cast(
	expression: ParameterOrValueExpressionNode,
	castType: string,
	requiresParentheses: boolean = false
): CastNode {
	return {
		type: "castNode",
		castType,
		expression,
		requiresParentheses,
	};
}

/**
 * Converts a column metamodel to an AST node.
 *
 * Generally, ColumnMetamodels cannot be used directly when constructing the AST; they must first be converted to
 * an AST node.
 *
 * @category DSL - Core
 * @param column The column metamodel to convert to an AST node.
 */
export function col(column: ColumnMetamodel<unknown>): ColumnReferenceNode {
	return column.toColumnReferenceNode();
}

/**
 * Creates a constant value expression.
 *
 * To avoid issues converting JavaScript primitives to SQL string values, constants are
 * actually passed as parameters. They are never concatenated into the SQL query string.
 *
 * The conversion of constants into SQL-compatible values is handled by `node-pg`, or any custom type parser
 * you register with `node-pg`.
 *
 * In `rose`, the difference between a constant and a parameter is that a constant is provided when the query is
 * created, whereas a parameter is provided when the query is executed.
 *
 * @category DSL - Core
 * @param value The constant value. Generally, the value should be a JavaScript primitive: boolean, number, or string.
 * @see https://www.postgresql.org/docs/13/sql-syntax-lexical.html#SQL-SYNTAX-CONSTANTS
 * @see https://github.com/brianc/node-pg-types
 */
export function constant<T extends SupportedConstant>(
	value: T
): ConstantNode<T> {
	return {
		type: "constantNode",
		getter: (): T => value,
	};
}

/**
 * Creates the literal keyword "DEFAULT". Useful when inserting rows.
 *
 * @category DSL - Core
 * @see https://www.postgresql.org/docs/13/sql-insert.html#id-1.9.3.152.6.2
 */
export function default_(): LiteralNode {
	return literal("DEFAULT");
}

/**
 * An alias for `default_()`.
 *
 * @category DSL - Core
 * @see {@link default_}
 */
export const dflt = default_;

/**
 * Creates any literal value, which will be inserted verbatim into the generated SQL.
 *
 * WARNING: this is a dangerous function! It allows inserting arbitrary text into the
 * SQL. It should be avoided at all costs!
 *
 * @category DSL - Core
 * @param value The exact string to be concatenated in the output SQL.
 */
export function literal(value: string): LiteralNode {
	return {
		type: "literalNode",
		value,
	};
}

/**
 * Creates a negated boolean expression.
 *
 * @category DSL - Core
 * @param expr The boolean expression to negate.
 * @see https://www.postgresql.org/docs/13/functions-logical.html
 */
export function not(expr: BooleanExpression): NotExpressionNode {
	return {
		type: "notExpressionNode",
		expression: expr,
	};
}

/**
 * Creates the literal value "NULL".
 *
 * @category DSL - Core
 */
export function null_(): LiteralNode {
	return literal("NULL");
}

/**
 * Creates a boolean expression group, with each expression separated by "OR".
 *
 * @category DSL - Core
 * @param first The first boolean expression in the group.
 * @param second The second boolean expression in the group.
 * @param rest Any additional boolean expressions to include in the group.
 * @see https://www.postgresql.org/docs/13/functions-logical.html
 */
export function or(
	first: BooleanExpression,
	second: BooleanExpression,
	...rest: readonly BooleanExpression[]
): BooleanExpressionGroupNode;
/**
 * Creates a boolean expression group, with each expression separated by "OR".
 *
 * @category DSL - Core
 * @param first An array of boolean expressions in the group. Passing an array with less than two elements will
 *  generate invalid SQL.
 * @see https://www.postgresql.org/docs/13/functions-logical.html
 */
export function or(
	first: readonly BooleanExpression[]
): BooleanExpressionGroupNode;
export function or(
	first: BooleanExpression | readonly BooleanExpression[],
	...rest: readonly BooleanExpression[]
): BooleanExpressionGroupNode {
	return {
		type: "booleanExpressionGroupNode",
		operator: "or",
		expressions: rectifyVariadicArgs(first, rest),
	};
}

/**
 * Creates a parameter value expression from a getter function.
 *
 * The getter function must accept a parameters object, and returns some value from that object.
 * The returned value will be passed to PostgreSQL as a query parameter.
 *
 * The conversion of parameters into SQL-compatible values is handled by `node-pg`, or any custom type parser
 * you register with `node-pg`.
 *
 * In `rose`, the difference between a constant and a parameter is that a constant is provided when the query is
 * created, whereas a parameter is provided when the query is executed.
 *
 * ```typescript
 * param((params) => params.myRowId)
 * ```
 *
 * @category DSL - Core
 * @param getter A function that accepts an object holding the parameters provided at execution time,
 *  and returns a value.
 * @see https://github.com/brianc/node-pg-types
 */
export function param<P, R>(getter: (params: P) => R): ConstantNode<R> {
	return {
		type: "constantNode",
		getter: getter,
	};
}

/**
 * Creates a row constructor expression.
 *
 * @category DSL - Core
 * @param expressions An array of expressions, each being an element of the row.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-SYNTAX-ROW-CONSTRUCTORS
 */
export function row(
	expressions: readonly ParameterOrValueExpressionNode[]
): RowConstructorNode;
/**
 * Creates a row constructor expression.
 *
 * @category DSL - Core
 * @param expressions Zero or more expressions, each being an element of the row.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-SYNTAX-ROW-CONSTRUCTORS
 */
export function row(
	...expressions: readonly ParameterOrValueExpressionNode[]
): RowConstructorNode;
export function row(
	first:
		| ParameterOrValueExpressionNode
		| readonly ParameterOrValueExpressionNode[]
		| undefined,
	...rest: readonly ParameterOrValueExpressionNode[]
): RowConstructorNode {
	return {
		type: "rowConstructorNode",
		expressionList: {
			type: "expressionListNode",
			expressions: first !== undefined ? rectifyVariadicArgs(first, rest) : [],
		},
	};
}

/**
 * A subscript expression, used to access a specific element of an array,
 * or when given an `upperSubscript`, a slice of an array.
 *
 * @category DSL - Core
 * @param expression Some expression that returns an array.
 * @param subscript The index in the array. If `upperSubscript` is provided, the lower bounds of the slice.
 * @param upperSubscript The upper bounds of the slice.
 * @see https://www.postgresql.org/docs/13/sql-expressions.html#SQL-EXPRESSIONS-SUBSCRIPTS
 */
export function subscript(
	expression: ParameterOrValueExpressionNode,
	subscript: ParameterOrValueExpressionNode<number>,
	upperSubscript?: ParameterOrValueExpressionNode<number>
): SubscriptNode {
	return {
		type: "subscriptNode",
		expression,
		lowerSubscript: subscript,
		upperSubscript,
	};
}

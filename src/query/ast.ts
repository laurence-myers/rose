/**
 A value expression is one of the following:

 - A constant or literal value
 - A column reference
 - A positional parameter reference, in the body of a function definition or prepared statement
 - A subscripted expression
 - A field selection expression
 - An operator invocation
 - A function call
 - An aggregate expression
 - A window function call
 - A type cast
 - A collation expression
 - A scalar subquery
 - An array constructor
 - A row constructor
 - Another value expression in parentheses (used to group subexpressions and override precedence)

 In addition to this list, there are a number of constructs that can be classified as an expression but do not follow any general syntax rules. These generally have the semantics of a function or operator and are explained in the appropriate location in Chapter 9. An example is the IS NULL clause.
 */
export interface ConstantNode<T> {
	type : 'constantNode';
	getter : (params : any) => T;
}

export interface ColumnReferenceNode {
	type : 'columnReferenceNode';
	//schema? : string;
	tableName : string;
	tableAlias? : string;
	columnName : string;
}

export interface TableReferenceNode {
	type : 'tableReferenceNode';
	tableName : string;
}

export interface BinaryOperationNode {
	type : 'binaryOperationNode';
	left : ParameterOrValueExpressionNode | ExpressionListNode; // Should SubSelectNode just be part of ValueExpressionNode?
	operator : string;
	right : ParameterOrValueExpressionNode | ExpressionListNode;
}

export interface BooleanBinaryOperationNode extends BinaryOperationNode {
	operator : '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IS DISTINCT FROM' | 'IS NOT DISTINCT FROM' | 'IN' | 'OVERLAPS';
}

export interface UnaryOperationNode {
	type : 'unaryOperationNode';
	expression : ParameterOrValueExpressionNode;
	operator : string;
	position : 'left' | 'right';
}

export interface BooleanUnaryOperationNode extends UnaryOperationNode {
	operator : 'IS NULL'
		| 'IS NOT NULL'
		| 'IS TRUE'
		| 'IS NOT TRUE'
		| 'IS FALSE'
		| 'IS NOT FALSE'
		| 'IS UNKNOWN'
		| 'IS NOT UNKNOWN';
}

export interface BooleanExpressionGroupNode {
	type : 'booleanExpressionGroupNode';
	operator : 'and' | 'or';
	expressions : BooleanExpression[];
}

export interface NotExpressionNode {
	type : 'notExpressionNode';
	expression : BooleanExpression; // TODO: check if NOT coerces other expressions into booleans
}

export type BooleanExpression = BooleanBinaryOperationNode | BooleanUnaryOperationNode | BooleanExpressionGroupNode | NotExpressionNode;

/**
 * Should generally NOT be used by consuming code, due security and syntax risks.
 */
export interface LiteralNode {
	type : 'literalNode';
	value : string;
}

export interface FunctionExpressionNode {
	type : 'functionExpressionNode';
	name : string;
	arguments : (ParameterOrValueExpressionNode | LiteralNode)[];
}

export interface NaturalSyntaxFunctionExpressionNodeArgument {
	key? : string;
	value : ParameterOrValueExpressionNode | LiteralNode;
}

export interface NaturalSyntaxFunctionExpressionNode {
	type : 'naturalSyntaxFunctionExpressionNode';
	name : string;
	arguments : NaturalSyntaxFunctionExpressionNodeArgument[];
}

/**
 * https://www.postgresql.org/docs/9.6/static/sql-expressions.html
 *
 * ✔ A constant or literal value - LiteralNode
 * ✔ A column reference - ColumnReferenceNode
 * ✔ A positional parameter reference, in the body of a function definition or prepared statement - ConstantNode
 * x A subscripted expression
 * x A field selection expression
 * ✔ An operator invocation - BinaryOperationNode, UnaryOperationNode
 * ✔ A function call - FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode
 * ~ An aggregate expression - partial support using FunctionExpressionNode, no support for FILTER or WITHIN GROUP
 * x A window function call
 * x A type cast
 * x A collation expression
 * ✔ A scalar subquery - SubSelectNode
 * x An array constructor
 * x A row constructor
 * x Another value expression in parentheses (used to group subexpressions and override precedence)
 */
export type ValueExpressionNode =
	LiteralNode
	| ColumnReferenceNode
	| BinaryOperationNode
	| UnaryOperationNode
	| FunctionExpressionNode
	| NaturalSyntaxFunctionExpressionNode
	| SubSelectNode;

export type ParameterOrValueExpressionNode =
	ConstantNode<any>
	| ValueExpressionNode;

export interface ExpressionListNode {
	type : 'expressionListNode';
	expressions : ParameterOrValueExpressionNode[];
}

export interface AliasedExpressionNode<TNode> {
	type : 'aliasedExpressionNode';
	alias : string;
	aliasPath : string[];
	expression : TNode;
}

export type AliasedSelectExpressionNode = AliasedExpressionNode<ParameterOrValueExpressionNode>;

export interface JoinNode {
	type : 'joinNode';
	joinType : 'inner' | 'left' | 'right' | 'full' | 'cross';
	fromItem : FromItemNode;
	on? : BooleanExpression;
	using? : ColumnReferenceNode[];
	// TODO: support lateral
	// TODO: support natural
}

export type FromExpressionNode = TableReferenceNode;

export type AliasedFromExpressionNode = AliasedExpressionNode<TableReferenceNode>;

export type FromItemNode = AliasedFromExpressionNode | FromExpressionNode;

export type AnyAliasedExpressionNode = AliasedFromExpressionNode | AliasedSelectExpressionNode;

export interface OrderByExpressionNode {
	type : 'orderByExpressionNode';
	expression : ParameterOrValueExpressionNode; //?
	order? : 'asc' | 'desc' | 'using';
	operator? : string; //?
	nulls? : 'first' | 'last';
}

export interface LimitOffsetNode {
	type : 'limitOffsetNode';
	limit : ConstantNode<number>; // could also be "ALL", but let's not support that
	offset : ConstantNode<number>;
}

/*
 https://www.postgresql.org/docs/9.6/static/sql-select.html
 [ WITH [ RECURSIVE ] with_query [, ...] ]
 SELECT [ ALL | DISTINCT [ ON ( expression [, ...] ) ] ]
 [ * | expression [ [ AS ] output_name ] [, ...] ]
 [ FROM from_item [, ...] ]
 [ WHERE condition ]
 [ GROUP BY grouping_element [, ...] ]
 [ HAVING condition [, ...] ]
 [ WINDOW window_name AS ( window_definition ) [, ...] ]
 [ { UNION | INTERSECT | EXCEPT } [ ALL | DISTINCT ] select ]
 [ ORDER BY expression [ ASC | DESC | USING operator ] [ NULLS { FIRST | LAST } ] [, ...] ]
 [ LIMIT { count | ALL } ]
 [ OFFSET start [ ROW | ROWS ] ]
 [ FETCH { FIRST | NEXT } [ count ] { ROW | ROWS } ONLY ]
 [ FOR { UPDATE | NO KEY UPDATE | SHARE | KEY SHARE } [ OF table_name [, ...] ] [ NOWAIT | SKIP LOCKED ] [...] ]

 where from_item can be one of:

 [ ONLY ] table_name [ * ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 [ TABLESAMPLE sampling_method ( argument [, ...] ) [ REPEATABLE ( seed ) ] ]
 [ LATERAL ] ( select ) [ AS ] alias [ ( column_alias [, ...] ) ]
 with_query_name [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 [ LATERAL ] function_name ( [ argument [, ...] ] )
 [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 [ LATERAL ] function_name ( [ argument [, ...] ] ) [ AS ] alias ( column_definition [, ...] )
 [ LATERAL ] function_name ( [ argument [, ...] ] ) AS ( column_definition [, ...] )
 [ LATERAL ] ROWS FROM( function_name ( [ argument [, ...] ] ) [ AS ( column_definition [, ...] ) ] [, ...] )
 [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 from_item [ NATURAL ] join_type from_item [ ON join_condition | USING ( join_column [, ...] ) ]

 and grouping_element can be one of:

 ( )
 expression
 ( expression [, ...] )
 ROLLUP ( { expression | ( expression [, ...] ) } [, ...] )
 CUBE ( { expression | ( expression [, ...] ) } [, ...] )
 GROUPING SETS ( grouping_element [, ...] )

 and with_query is:

 with_query_name [ ( column_name [, ...] ) ] AS ( select | values | insert | update | delete )

 TABLE [ ONLY ] table_name [ * ]
 */
export type SelectOutputExpression = ParameterOrValueExpressionNode | AliasedSelectExpressionNode;

export interface SelectCommandNode {
	type : 'selectCommandNode';
	distinction : 'distinct' | 'all' | 'on';
	distinctOn? : ParameterOrValueExpressionNode;
	outputExpressions : Array<SelectOutputExpression>; // should we also support *?
	fromItems : FromItemNode[];
	joins : JoinNode[];
	conditions : BooleanExpression[];
	ordering : OrderByExpressionNode[];
	limit? : LimitOffsetNode;
}

export interface SubSelectNode {
	type : 'subSelectNode';
	query : SelectCommandNode;
}

export type AstNode = SelectCommandNode | ParameterOrValueExpressionNode | AliasedSelectExpressionNode | JoinNode | FromItemNode
	| OrderByExpressionNode | FunctionExpressionNode | LimitOffsetNode | BooleanExpressionGroupNode | NotExpressionNode
	| ExpressionListNode;

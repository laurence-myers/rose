export interface ConstantNode<T> {
	type: "constantNode";
	getter: (params: any) => T;
}

export interface ColumnReferenceNode {
	type: "columnReferenceNode";
	//schema? : string;
	tableOrAlias: string;
	columnName: string;
}

export interface BinaryOperationNode {
	type: "binaryOperationNode";
	left: ParameterOrValueExpressionNode | ExpressionListNode;
	operator: string;
	right: ParameterOrValueExpressionNode | ExpressionListNode;
}

export type BooleanBinaryOperator =
	// Equality
	| "="
	| "!="
	// Comparison
	| "<"
	| "<="
	| ">"
	| ">="
	// Regexp
	| "~"
	| "~*"
	| "!~"
	| "!~*"
	// Misc
	| "IS DISTINCT FROM"
	| "IS NOT DISTINCT FROM"
	| "IN"
	| "OVERLAPS"
	// Pattern matching
	| "LIKE"
	| "NOT LIKE"
	| "ILIKE"
	| "NOT ILIKE"
	// Array operators
	| "@>"
	| "<@"
	| "&&";

export interface BooleanBinaryOperationNode extends BinaryOperationNode {
	operator: BooleanBinaryOperator;
}

export interface UnaryOperationNode {
	type: "unaryOperationNode";
	expression: ParameterOrValueExpressionNode;
	operator: string;
	position: "left" | "right";
}

export interface BooleanUnaryOperationNode extends UnaryOperationNode {
	operator:
		| "EXISTS"
		| "IS NULL"
		| "IS NOT NULL"
		| "IS TRUE"
		| "IS NOT TRUE"
		| "IS FALSE"
		| "IS NOT FALSE"
		| "IS UNKNOWN"
		| "IS NOT UNKNOWN";
}

export interface BooleanExpressionGroupNode {
	type: "booleanExpressionGroupNode";
	operator: "and" | "or";
	expressions: BooleanExpression[];
}

export interface NotExpressionNode {
	type: "notExpressionNode";
	expression: BooleanExpression; // TODO: check if NOT coerces other expressions into booleans
}

export type BooleanExpression =
	| BooleanBinaryOperationNode
	| BooleanUnaryOperationNode
	| BooleanExpressionGroupNode
	| NotExpressionNode;

/**
 * Should generally NOT be used by consuming code, due to security and syntax risks.
 */
export interface LiteralNode {
	type: "literalNode";
	value: string;
}

export interface FunctionExpressionNode {
	type: "functionExpressionNode";
	name: string;
	arguments: (
		| ParameterOrValueExpressionNode
		| LiteralNode
		| BooleanExpression
	)[];
}

export interface NaturalSyntaxFunctionExpressionNodeArgument {
	key?: string;
	value: ParameterOrValueExpressionNode | LiteralNode | BooleanExpression;
}

export interface NaturalSyntaxFunctionExpressionNode {
	type: "naturalSyntaxFunctionExpressionNode";
	name?: string;
	omitParentheses?: boolean;
	arguments: NaturalSyntaxFunctionExpressionNodeArgument[];
}

export interface CastNode {
	type: "castNode";
	castType: string;
	expression: ParameterOrValueExpressionNode;
	requiresParentheses?: boolean;
}

export interface ArrayConstructorNode {
	type: "arrayConstructorNode";
	expressions: ParameterOrValueExpressionNode[];
}

export interface RowConstructorNode {
	type: "rowConstructorNode";
	expressionList: ExpressionListNode;
}

export interface SubscriptNode {
	type: "subscriptNode";
	expression: ParameterOrValueExpressionNode;
	lowerSubscript: ParameterOrValueExpressionNode;
	upperSubscript?: ParameterOrValueExpressionNode;
}

/**
 * https://www.postgresql.org/docs/9.6/static/sql-expressions.html
 *
 * - ✔ A constant or literal value - LiteralNode
 * - ✔ A column reference - ColumnReferenceNode
 * - ✔ A positional parameter reference, in the body of a function definition or prepared statement - ConstantNode
 * - ✔ A subscripted expression
 * - x A field selection expression
 * - ✔ An operator invocation - BinaryOperationNode, UnaryOperationNode
 * - ✔ A function call - FunctionExpressionNode, NaturalSyntaxFunctionExpressionNode
 * - ~ An aggregate expression - partial support using FunctionExpressionNode, no support for FILTER or WITHIN GROUP
 * - x A window function call
 * - ✔ A type cast
 * - x A collation expression
 * - ✔ A scalar subquery - SubSelectNode
 * - ✔ An array constructor
 * - ✔ A row constructor
 * - x Another value expression in parentheses (used to group subexpressions and override precedence)
 */
export type ValueExpressionNode =
	| ArrayConstructorNode
	| BinaryOperationNode
	| CastNode
	| ColumnReferenceNode
	| FunctionExpressionNode
	| LiteralNode
	| NaturalSyntaxFunctionExpressionNode
	| RowConstructorNode
	| SimpleColumnReferenceNode
	| SubscriptNode
	| SubSelectNode
	| UnaryOperationNode;

export type ParameterOrValueExpressionNode<TConstantValue = unknown> =
	| ConstantNode<TConstantValue>
	| ValueExpressionNode;

export interface ExpressionListNode {
	type: "expressionListNode";
	expressions: ParameterOrValueExpressionNode[];
}

export interface AliasNode {
	type: "aliasNode";
	name: string;
	path: string[];
}

export interface AliasedExpressionNode<TNode> {
	type: "aliasedExpressionNode";
	alias: AliasNode;
	expression: TNode;
}

export type AliasedSelectExpressionNode =
	AliasedExpressionNode<ParameterOrValueExpressionNode>;

/**
 * Used to define columns returned by function "from items" that return records.
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface ColumnDefinitionNode {
	type: "columnDefinitionNode";
	columnName: string;
	dataType: string;
}

/**
 * FromItemFunctionNode can have either one or more functions, each with their own
 * column definitions.
 */
export interface FromItemFunctionExpressionNode {
	functionExpression: FunctionExpressionNode;
	columnDefinitions?: ColumnDefinitionNode[];
}

/**
 *
 *  [ LATERAL ] function_name ( [ argument [, ...] ] )
 *              [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *  [ LATERAL ] function_name ( [ argument [, ...] ] ) [ AS ] alias ( column_definition [, ...] )
 *  [ LATERAL ] function_name ( [ argument [, ...] ] ) AS ( column_definition [, ...] )
 *  [ LATERAL ] ROWS FROM( function_name ( [ argument [, ...] ] ) [ AS ( column_definition [, ...] ) ] [, ...] )
 *              [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface FromItemFunctionNode {
	type: "fromItemFunctionNode";
	alias?: AliasNode;
	columnAliases?: string[];
	functionExpressions: FromItemFunctionExpressionNode[];
	lateral?: boolean;
	withOrdinality?: boolean;
}

/**
 * from_item [ NATURAL ] join_type from_item [ ON join_condition | USING ( join_column [, ...] ) ]
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface FromItemJoinNode {
	type: "fromItemJoinNode";
	joinType: "inner" | "left" | "right" | "full" | "cross";
	leftFromItem: FromItemNode;
	natural?: boolean;
	on?: BooleanExpression;
	rightFromItem: FromItemNode;
	using?: SimpleColumnReferenceNode[];
}

/**
 *  [ LATERAL ] ( select ) [ AS ] alias [ ( column_alias [, ...] ) ]
 *
 *  @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface FromItemSubSelectNode {
	type: "fromItemSubSelectNode";
	alias: AliasNode;
	columnAliases?: string[];
	lateral?: boolean;
	query: SubSelectNode;
}

/**
 * Used in "from items" from a table.
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface TableSample {
	arguments: ParameterOrValueExpressionNode[];
	repeatableSeed?: ParameterOrValueExpressionNode;
	samplingMethod: "BERNOULLI" | "SYSTEM" | string;
}

/**
 *  [ ONLY ] table_name [ * ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *              [ TABLESAMPLE sampling_method ( argument [, ...] ) [ REPEATABLE ( seed ) ] ]
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface FromItemTableNode {
	type: "fromItemTableNode";
	alias?: AliasNode;
	columnAliases?: string[];
	only?: boolean;
	table: string;
	tableSample?: TableSample;
}

/**
 *  with_query_name [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *
 * @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export interface FromItemWithNode {
	type: "fromItemWithNode";
	alias?: AliasNode;
	columnAliases?: string[];
	withQueryName: string;
}

/**
 * from_item can be one of:
 *
 *  [ ONLY ] table_name [ * ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *              [ TABLESAMPLE sampling_method ( argument [, ...] ) [ REPEATABLE ( seed ) ] ]
 *  [ LATERAL ] ( select ) [ AS ] alias [ ( column_alias [, ...] ) ]
 *  with_query_name [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *  [ LATERAL ] function_name ( [ argument [, ...] ] )
 *              [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *  [ LATERAL ] function_name ( [ argument [, ...] ] ) [ AS ] alias ( column_definition [, ...] )
 *  [ LATERAL ] function_name ( [ argument [, ...] ] ) AS ( column_definition [, ...] )
 *  [ LATERAL ] ROWS FROM( function_name ( [ argument [, ...] ] ) [ AS ( column_definition [, ...] ) ] [, ...] )
 *              [ WITH ORDINALITY ] [ [ AS ] alias [ ( column_alias [, ...] ) ] ]
 *  from_item [ NATURAL ] join_type from_item [ ON join_condition | USING ( join_column [, ...] ) ]
 *
 *  @see https://www.postgresql.org/docs/13/sql-select.html#SQL-FROM
 */
export type FromItemNode =
	| FromItemFunctionNode
	| FromItemJoinNode
	| FromItemSubSelectNode
	| FromItemTableNode
	| FromItemWithNode;

/**
 * Nodes that are only used by other "from item" nodes.
 */
type FromRelatedNode = ColumnDefinitionNode | FromItemNode;

export type AnyAliasedExpressionNode = AliasedSelectExpressionNode;

export interface OrderByExpressionNode {
	type: "orderByExpressionNode";
	expression: ParameterOrValueExpressionNode; //?
	order?: "asc" | "desc" | "using";
	operator?: string; //?
	nulls?: "first" | "last";
}

export interface GroupByExpressionNode {
	type: "groupByExpressionNode";
	expression: ParameterOrValueExpressionNode;
}

export interface LimitOffsetNode {
	type: "limitOffsetNode";
	limit: ConstantNode<number>; // could also be "ALL", but let's not support that
	offset: ConstantNode<number>;
}

export interface SelectLockingNode {
	type: "selectLockingNode";
	strength: "UPDATE" | "NO KEY UPDATE" | "SHARE" | "KEY SHARE";
	of: string[];
	wait?: "NOWAIT" | "SKIP LOCKED";
}

/**
 * with_query_name [ ( column_name [, ...] ) ] AS [ [ NOT ] MATERIALIZED ] ( select | values | insert | update | delete )
 */
export interface WithNode {
	type: "withNode";
	columnNames?: string[];
	materialized?: boolean;
	name: string;
	recursive?: boolean;
	/**
	 * TODO: support TABLE, VALUES
	 * TODO: proper support for non-select queries
	 */
	query: SelectCommandNode;
	// | InsertCommandNode
	// | UpdateCommandNode
	// | DeleteCommandNode;
}

export type SelectNodes =
	| GroupByExpressionNode
	| LimitOffsetNode
	| OrderByExpressionNode
	| SelectLockingNode
	| WithNode;

export type SelectOutputExpression =
	| ParameterOrValueExpressionNode
	| AliasedSelectExpressionNode;

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
export interface SelectCommandNode {
	type: "selectCommandNode";
	distinction: "distinct" | "all" | "on";
	distinctOn?: ParameterOrValueExpressionNode;
	outputExpressions: Array<SelectOutputExpression>; // should we also support *?
	fromItems: FromItemNode[];
	conditions: BooleanExpression[];
	ordering: OrderByExpressionNode[];
	grouping: GroupByExpressionNode[];
	limit?: LimitOffsetNode;
	with?: WithNode[];
	locking: SelectLockingNode[];
}

export interface SubSelectNode {
	type: "subSelectNode";
	query: SelectCommandNode;
}

/*
 https://www.postgresql.org/docs/current/sql-delete.html
 [ WITH [ RECURSIVE ] with_query [, ...] ]
 DELETE FROM [ ONLY ] table_name [ * ] [ [ AS ] alias ]
 [ USING using_list ]
 [ WHERE condition | WHERE CURRENT OF cursor_name ]
 [ RETURNING * | output_expression [ [ AS ] output_name ] [, ...] ]
*/
export interface DeleteCommandNode {
	type: "deleteCommandNode";
	from: FromItemNode;
	conditions: BooleanExpression[];
}

export interface SimpleColumnReferenceNode {
	type: "simpleColumnReferenceNode";
	columnName: string;
}

export interface SetItemNode {
	type: "setItemNode";
	column: SimpleColumnReferenceNode;
	expression: ParameterOrValueExpressionNode;
}

/*
 [ WITH [ RECURSIVE ] with_query [, ...] ]
 UPDATE [ ONLY ] table_name [ * ] [ [ AS ] alias ]
     SET { column_name = { expression | DEFAULT } |
           ( column_name [, ...] ) = [ ROW ] ( { expression | DEFAULT } [, ...] ) |
           ( column_name [, ...] ) = ( sub-SELECT )
         } [, ...]
     [ FROM from_list ]
     [ WHERE condition | WHERE CURRENT OF cursor_name ]
     [ RETURNING * | output_expression [ [ AS ] output_name ] [, ...] ]
*/
export interface UpdateCommandNode {
	type: "updateCommandNode";
	table: FromItemNode;
	setItems: SetItemNode[];
	fromItems: FromItemNode[];
	conditions: BooleanExpression[];
	returning?: Array<SelectOutputExpression>;
}

// INSERT ... ON CONFLICT nodes below

export type IndexExpressionNode =
	| BinaryOperationNode
	| UnaryOperationNode
	| FunctionExpressionNode
	| NaturalSyntaxFunctionExpressionNode;

export interface OnConflictTargetIndexNode {
	type: "onConflictTargetIndexNode";
	identifier: SimpleColumnReferenceNode | IndexExpressionNode;
	collation?: string;
	opclass?: string;
}

export interface OnConflictTargetIndexesNode {
	type: "onConflictTargetIndexesNode";
	indexes: OnConflictTargetIndexNode[];
	where?: BooleanExpression;
}

export interface OnConflictTargetOnConstraintNode {
	type: "onConflictTargetOnConstraintNode";
	constraintName: string; // TODO: make this type-safe
}

export type OnConflictTargetNode =
	| OnConflictTargetIndexesNode
	| OnConflictTargetOnConstraintNode;

export interface OnConflictDoNothingNode {
	type: "onConflictDoNothingNode";
	target?: OnConflictTargetNode;
}

export interface OnConflictDoUpdateNode {
	type: "onConflictDoUpdateNode";
	target: OnConflictTargetNode;
	setItems: SetItemNode[];
	where?: BooleanExpression;
}

export interface OnConflictNode {
	type: "onConflictNode";
	conflictAction: OnConflictDoNothingNode | OnConflictDoUpdateNode;
}

type OnConflictNodes =
	| IndexExpressionNode
	| OnConflictTargetIndexNode
	| OnConflictTargetIndexesNode
	| OnConflictTargetOnConstraintNode
	| OnConflictDoNothingNode
	| OnConflictDoUpdateNode
	| OnConflictNode;

/*
[ WITH [ RECURSIVE ] with_query [, ...] ]
INSERT INTO table_name [ AS alias ] [ ( column_name [, ...] ) ]
    [ OVERRIDING { SYSTEM | USER } VALUE ]
    { DEFAULT VALUES | VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
    [ ON CONFLICT [ conflict_target ] conflict_action ]
    [ RETURNING * | output_expression [ [ AS ] output_name ] [, ...] ]

where conflict_target can be one of:

    ( { index_column_name | ( index_expression ) } [ COLLATE collation ] [ opclass ] [, ...] ) [ WHERE index_predicate ]
    ON CONSTRAINT constraint_name

and conflict_action is one of:

    DO NOTHING
    DO UPDATE SET { column_name = { expression | DEFAULT } |
                    ( column_name [, ...] ) = [ ROW ] ( { expression | DEFAULT } [, ...] ) |
                    ( column_name [, ...] ) = ( sub-SELECT )
                  } [, ...]
              [ WHERE condition ]
*/
export interface InsertCommandNode {
	type: "insertCommandNode";
	table: FromItemNode;
	columns: SimpleColumnReferenceNode[];
	values: ParameterOrValueExpressionNode[][];
	query?: SubSelectNode;
	onConflict?: OnConflictNode;
	returning?: Array<SelectOutputExpression>;
}

export interface TransactionModeNode {
	type: "transactionModeNode";
	isolationLevel?:
		| "SERIALIZABLE"
		| "REPEATABLE READ"
		| "READ COMMITTED"
		| "READ UNCOMMITTED";
	readMode?: "WRITE" | "ONLY";
	deferrable?: boolean;
}

export interface BeginCommandNode {
	type: "beginCommandNode";
	transactionMode?: TransactionModeNode;
}

export interface SetTransactionCommandNode {
	type: "setTransactionCommandNode";
	transactionMode: TransactionModeNode;
}

export interface SetTransactionSnapshotCommandNode {
	type: "setTransactionSnapshotCommandNode";
	snapshotId: ConstantNode<string>;
}

export interface SetSessionsCharacteristicsAsTransactionCommandNode {
	type: "setSessionsCharacteristicsAsTransactionCommandNode";
	transactionMode: TransactionModeNode;
}

export interface SavepointCommandNode {
	type: "savepointCommandNode";
	name: ConstantNode<string>;
}

export interface CommitCommandNode {
	type: "commitCommandNode";
	chain?: boolean;
}

export interface RollbackCommandNode {
	type: "rollbackCommandNode";
	chain?: boolean;
}

export interface RollbackToSavepointCommandNode {
	type: "rollbackToSavepointCommandNode";
	name: ConstantNode<string>;
}

export interface ReleaseSavepointCommandNode {
	type: "releaseSavepointCommandNode";
	name: ConstantNode<string>;
}

type TransactionCommandNodes =
	| BeginCommandNode
	| CommitCommandNode
	| ReleaseSavepointCommandNode
	| RollbackCommandNode
	| RollbackToSavepointCommandNode
	| SavepointCommandNode
	| SetSessionsCharacteristicsAsTransactionCommandNode
	| SetTransactionCommandNode
	| SetTransactionSnapshotCommandNode;

type TransactionNodes = TransactionCommandNodes | TransactionModeNode;

export type AnyCommandNode =
	| SelectCommandNode
	| DeleteCommandNode
	| UpdateCommandNode
	| InsertCommandNode
	| TransactionCommandNodes;

export type AstNode =
	| AliasNode
	| AliasedSelectExpressionNode
	| AnyCommandNode
	| BooleanExpressionGroupNode
	| ExpressionListNode
	| FromRelatedNode
	| FunctionExpressionNode
	| NotExpressionNode
	| OnConflictNodes
	| ParameterOrValueExpressionNode
	| SelectNodes
	| SetItemNode
	| SimpleColumnReferenceNode
	| TransactionNodes
	| WithNode;

import {
	AnyAliasedExpressionNode,
	AstNode,
	BeginCommandNode,
	BinaryOperationNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	CastNode,
	ColumnReferenceNode,
	CommitCommandNode,
	ConstantNode,
	DeleteCommandNode,
	ExpressionListNode,
	FunctionExpressionNode,
	GroupByExpressionNode,
	InsertCommandNode,
	JoinNode,
	LimitOffsetNode,
	LiteralNode,
	NaturalSyntaxFunctionExpressionNode,
	NotExpressionNode,
	OnConflictDoNothingNode,
	OnConflictDoUpdateNode,
	OnConflictNode,
	OnConflictTargetIndexesNode,
	OnConflictTargetIndexNode,
	OnConflictTargetOnConstraintNode,
	OrderByExpressionNode,
	ReleaseSavepointCommandNode,
	RollbackCommandNode,
	RollbackToSavepointCommandNode,
	SavepointCommandNode,
	SelectCommandNode,
	SelectLockingNode,
	SetItemNode,
	SetSessionsCharacteristicsAsTransactionCommandNode,
	SetTransactionCommandNode,
	SetTransactionSnapshotCommandNode,
	SimpleColumnReferenceNode,
	SubSelectNode,
	TableReferenceNode,
	TransactionModeNode,
	UnaryOperationNode,
	UpdateCommandNode,
	WithNode
} from "../ast";
import { assertNever } from "../../lang";
import { NotEnoughExpressionsError, UnsupportedOperationError } from "../../errors";
import { BaseWalker } from "./baseWalker";
import { TableMap } from "../../data";

interface WalkedQueryData {
	sql: string;
	parameterGetters: Array<(params: unknown) => unknown>;
}

const JOIN_TEXT_MAP: {
	[K in JoinNode['joinType']]: string;
} = {
	'inner': 'INNER',
	'left': 'LEFT OUTER',
	'right': 'RIGHT OUTER',
	'full': 'FULL OUTER',
	'cross': 'CROSS'
};

const BOOLEAN_EXPRESSION_GROUP_OPERATOR_MAP: {
	[K in BooleanExpressionGroupNode['operator']]: string;
} = {
	'and': 'AND',
	'or': 'OR'
};

/**
 * Converts an AST to a SQL string.
 */
export class SqlAstWalker extends BaseWalker {
	protected sb: string = '';
	protected parameterGetters: Array<(p: unknown) => unknown> = [];

	constructor(
		protected queryAst: AstNode,
		protected tableMap: TableMap = new TableMap()
	) {
		super();
	}

	toSql(): WalkedQueryData {
		this.walk(this.queryAst);
		return {
			sql: this.sb,
			parameterGetters: this.parameterGetters
		};
	}

	protected doListWalk<N extends AstNode>() {
		return (node: N, index: number): void => {
			if (index > 0) {
				this.sb += `, `;
			}
			this.walk(node);
		};
	}
	protected walkAliasedExpressionNode(node: AnyAliasedExpressionNode): void {
		this.walk(node.expression);
		this.sb += ` as "`;
		this.sb += node.alias;
		this.sb += `"`;
	}

	protected walkBeginCommandNode(node: BeginCommandNode): void {
		this.sb += `BEGIN`;
		if (node.transactionMode && [
			node.transactionMode.deferrable,
			node.transactionMode.readMode,
			node.transactionMode.isolationLevel
		].some((entry) => entry !== undefined)) {
			this.sb += ` `;
			this.walk(node.transactionMode);
		}
	}

	protected walkBinaryOperationNode(node: BinaryOperationNode): void {
		this.walk(node.left);
		this.sb += ` `;
		this.sb += node.operator;
		this.sb += ` `;
		this.walk(node.right);
	}

	protected walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void {
		if (node.expressions.length < 2) {
			throw new NotEnoughExpressionsError(
				`Boolean expression group for "${ node.operator }" does not have enough expressions. Needed: 2, found: ${ node.expressions.length }`
			);
		}
		const operator = BOOLEAN_EXPRESSION_GROUP_OPERATOR_MAP[node.operator];
		this.sb += `(`;
		node.expressions.forEach((node: BooleanExpression, index: number): void => {
			if (index > 0) {
				this.sb += ` `;
				this.sb += operator;
				this.sb += ` `;
			}
			this.walk(node);
		});
		this.sb += `)`;
	}

	protected walkCastNode(node: CastNode): void {
		if (node.requiresParentheses) {
			this.sb += `(`;
		}
		this.walk(node.expression);
		if (node.requiresParentheses) {
			this.sb += `)`;
		}
		this.sb += '::';
		this.sb += node.castType;
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		const tableAlias = node.tableAlias || this.tableMap.get(node.tableName);
		this.sb += `"`;
		this.sb += tableAlias;
		this.sb += `"."`;
		this.sb += node.columnName;
		this.sb += `"`;
	}

	protected walkCommitCommandNode(node: CommitCommandNode): void {
		this.sb += `COMMIT`;
		if (node.chain !== undefined) {
			this.sb += ` AND `;
			if (node.chain === false) {
				this.sb += `NO `;
			}
			this.sb += `CHAIN`
		}
	}

	protected walkConstantNode(node: ConstantNode<any>): void {
		this.parameterGetters.push(node.getter);
		this.sb += `$`;
		this.sb += this.parameterGetters.length.toString();
	}

	protected walkDeleteCommandNode(node: DeleteCommandNode): void {
		// TODO: support WITH (RECURSIVE)

		this.sb = "DELETE FROM ";

		// TODO: support ONLY

		this.walk(node.from);

		// TODO: support USING

		if (node.conditions.length > 0) {
			this.sb += " WHERE ";
			this.walkNodes(node.conditions);
		}

		// TODO: support WHERE CURRENT OF

		// TODO: support RETURNING * or (aliased) output expressions
	}

	protected walkExpressionListNode(node: ExpressionListNode): void {
		// TODO: should this throw an error if the expressions array is empty?
		this.sb += '(';
		node.expressions.forEach(this.doListWalk());
		this.sb += ')';
	}

	protected walkFunctionExpressionNode(node: FunctionExpressionNode): void {
		this.sb += node.name;
		this.sb += '(';
		if (node.arguments.length > 0) {
			node.arguments.forEach(this.doListWalk());
		}
		this.sb += ')';
	}

	protected walkGroupByExpressionNode(node: GroupByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkInsertCommandNode(node: InsertCommandNode): void {
		this.sb += `INSERT INTO `;
		this.walk(node.table);
		if (node.columns.length > 0) {
			this.sb += ' (';
			if (node.columns.length > 0) {
				node.columns.forEach(this.doListWalk());
			}
			this.sb += ')';
		}
		if (node.values.length > 0) {
			this.sb += ` VALUES `;
			node.values.forEach((values, index) => {
				if (index > 0) {
					this.sb += `, `;
				}
				this.sb += '(';
				values.forEach(this.doListWalk());
				this.sb += ')';
			});
		} else if (node.query) {
			this.sb += ' ';
			this.walk(node.query);
		}
		if (node.onConflict) {
			this.sb += ` ON CONFLICT `;
			this.walk(node.onConflict);
		}
		if (node.returning) {
			this.sb += ` RETURNING `;
			node.returning.forEach(this.doListWalk());
		}
	}

	protected walkJoinNode(node: JoinNode): void {
		const joinText = JOIN_TEXT_MAP[node.joinType];
		if (node.joinType == 'cross' && (node.on || (node.using && node.using.length > 0))) {
			throw new UnsupportedOperationError(`Cross joins cannot specify "on" or "using" conditions.`);
		}
		if (node.on && node.using && node.using.length > 0) {
			throw new UnsupportedOperationError(`Joins cannot specify both "on" and "using" conditions.`);
		}

		this.sb += ` `;
		this.sb += joinText;
		this.sb += ` JOIN `;
		this.walk(node.fromItem);
		if (node.on) {
			this.sb += ` ON `;
			this.walk(node.on);
		} else if (node.using) {
			this.sb += ` USING (`;
			node.using.forEach(this.doListWalk());
			this.sb += `)`;
		}
		// TODO: support "natural"
	}

	protected walkLimitOffsetNode(node: LimitOffsetNode): void {
		this.sb += 'LIMIT ';
		this.walk(node.limit);
		// TODO: decouple limit and offset nodes
		this.sb += ' OFFSET ';
		this.walk(node.offset);
	}

	protected walkLiteralNode(node: LiteralNode): void {
		this.sb += node.value;
	}

	protected walkNaturalSyntaxFunctionExpressionNode(node: NaturalSyntaxFunctionExpressionNode): void {
		if (node.name !== undefined) {
			this.sb += node.name;
		}
		if (!node.omitParentheses) {
			this.sb += '(';
		} else if (node.name !== undefined) {
			this.sb += ' ';
		}
		if (node.arguments.length > 0) {
			node.arguments.forEach((arg, index) => {
				if (arg.key) {
					this.sb += arg.key;
					this.sb += ' ';
				}
				this.walk(arg.value);
				if (index < node.arguments.length - 1) {
					this.sb += " ";
				}
			});
		}
		if (!node.omitParentheses) {
			this.sb += ')';
		}
	}

	protected walkNotExpressionNode(node: NotExpressionNode): void {
		this.sb += `NOT (`;
		this.walk(node.expression);
		this.sb += `)`;
	}

	protected walkOnConflictDoNothingNode(node: OnConflictDoNothingNode): void {
		if (node.target) {
			this.walk(node.target);
		}
		this.sb += ` DO NOTHING`;
	}

	protected walkOnConflictDoUpdateNode(node: OnConflictDoUpdateNode): void {
		this.walk(node.target);
		this.sb += ` DO UPDATE SET `;
		node.setItems.forEach(this.doListWalk());
		if (node.where) {
			this.sb += ` WHERE `;
			this.walk(node.where);
		}
	}

	protected walkOnConflictNode(node: OnConflictNode): void {
		this.walk(node.conflictAction);
	}

	protected walkOnConflictTargetIndexesNode(node: OnConflictTargetIndexesNode): void {
		this.sb += `(`;
		node.indexes.forEach(this.doListWalk());
		this.sb += `)`;
		if (node.where) {
			this.sb += ` WHERE `;
			this.walk(node.where);
		}
	}

	protected walkOnConflictTargetIndexNode(node: OnConflictTargetIndexNode): void {
		this.walk(node.identifier);
		if (node.collation) {
			this.sb += ` COLLATE '`;
			this.sb += node.collation;
			this.sb += `'`;
		}
		if (node.opclass) {
			this.sb += ` "`
			this.sb += node.opclass;
			this.sb += `"`
		}
	}

	protected walkOnConflictTargetOnConstraintNode(node: OnConflictTargetOnConstraintNode): void {
		this.sb += `ON CONSTRAINT "`;
		this.sb += node.constraintName;
		this.sb += `"`;
	}

	protected walkOrderByExpressionNode(node: OrderByExpressionNode): void {
		this.walk(node.expression);
		if (node.order) {
			switch (node.order) {
				case 'asc':
					this.sb += ' ASC';
					break;
				case 'desc':
					this.sb += ' DESC';
					break;
				case 'using':
					this.sb += ' USING ';
					if (!node.operator) {
						throw new UnsupportedOperationError(`An order by expression with "using" must also have an operator.`);
					}
					this.sb += node.operator;
					break;
				default:
					return assertNever(node.order);
			}
		}
	}

	protected walkReleaseSavepointCommandNode(node: ReleaseSavepointCommandNode): void {
		this.sb += `RELEASE SAVEPOINT `;
		this.walk(node.name);
	}

	protected walkRollbackCommandNode(node: RollbackCommandNode): void {
		this.sb += `ROLLBACK`;
		if (node.chain !== undefined) {
			this.sb += ` AND `;
			if (node.chain === false) {
				this.sb += `NO `;
			}
			this.sb += `CHAIN`
		}
	}

	protected walkRollbackToSavepointCommandNode(node: RollbackToSavepointCommandNode): void {
		this.sb += `ROLLBACK TO SAVEPOINT `;
		this.walk(node);
	}

	protected walkSavepointCommandNode(node: SavepointCommandNode): void {
		this.sb += `SAVEPOINT `;
		this.walk(node.name);
	}

	protected walkSelectCommandNode(node: SelectCommandNode): void {
		if (node.with) {
			this.walk(node.with);
		}
		this.sb += "SELECT ";
		switch (node.distinction) {
			case "distinct":
				this.sb += "DISTINCT ";
				break;
			case "all":
				break;
			case "on":
				this.sb += "DISTINCT ON (";
				if (node.distinctOn) {
					this.walk(node.distinctOn);
				} else {
					throw new UnsupportedOperationError(`When using "distinct on", you must provide a distinctOn expression.`);
				}
				this.sb += ") ";
				break;
			default:
				assertNever(node.distinction);
		}
		node.outputExpressions.forEach(this.doListWalk());
		if (node.fromItems.length > 0) {
			this.sb += " FROM ";
			node.fromItems.forEach(this.doListWalk());
		}
		if (node.joins.length > 0) {
			this.walkNodes(node.joins);
		}
		if (node.conditions.length > 0) {
			this.sb += " WHERE ";
			// If there's more than one "where" condition, wrap them in `and` by default
			if (node.conditions.length > 1) {
				this.walkBooleanExpressionGroupNode({
					expressions: node.conditions,
					operator: "and",
					type: "booleanExpressionGroupNode"
				});
			} else {
				this.walkNodes(node.conditions);
			}
		}
		if (node.grouping.length > 0) {
			this.sb += " GROUP BY (";
			node.grouping.forEach(this.doListWalk());
			this.sb += ")";
		}
		if (node.ordering.length > 0) {
			this.sb += " ORDER BY ";
			node.ordering.forEach(this.doListWalk());
		}
		if (node.limit) {
			this.sb += " ";
			this.walk(node.limit);
		}
		if (node.locking.length > 0) {
			this.walkNodes(node.locking);
		}
	}

	protected walkSelectLockingNode(node: SelectLockingNode): void {
		this.sb += " FOR ";
		this.sb += node.strength;
		if (node.of.length > 0) {
			this.sb += " OF ";
			node.of.forEach(this.doListWalk());
		}
		if (node.wait) {
			this.sb += " ";
			this.sb += node.wait;
		}
	}

	protected walkSetItemNode(node: SetItemNode): void {
		this.walk(node.column);
		this.sb += ` = `;
		this.walk(node.expression);
	}

	protected walkSetSessionsCharacteristicsAsTransactionCommandNode(node: SetSessionsCharacteristicsAsTransactionCommandNode): void {
		this.sb += `SET SESSION CHARACTERISTICS AS TRANSACTION `;
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionCommandNode(node: SetTransactionCommandNode): void {
		this.sb += `SET TRANSACTION `;
		this.walk(node.transactionMode);
	}

	protected walkSetTransactionSnapshotCommandNode(node: SetTransactionSnapshotCommandNode): void {
		this.sb += `SET TRANSACTION SNAPSHOT `;
		this.walk(node.snapshotId);
	}

	protected walkSimpleColumnReferenceNode(node: SimpleColumnReferenceNode): void {
		this.sb += `"`;
		this.sb += node.columnName;
		this.sb += `"`;
	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		this.sb += `(`;
		this.walk(node.query);
		this.sb += `)`;
	}

	protected walkTableReferenceNode(node: TableReferenceNode): void {
		this.sb += `"`;
		this.sb += node.tableName;
		this.sb += `"`;
	}

	protected walkTransactionModeNode(node: TransactionModeNode): void {
		const values = [];
		if (node.isolationLevel) {
			values.push(`ISOLATION LEVEL ${ node.isolationLevel }`); // TODO: this is cheating, should abstract the output from the enum string
		}
		if (node.readMode) {
			values.push(`READ ${ node.readMode }`); // TODO: also cheating
		}
		if (node.deferrable !== undefined) {
			values.push(
				(node.deferrable === false ? 'NOT ' : '')
				+ `DEFERRABLE`
			);
		}
		this.sb += values.join(' ');
	}

	protected walkUnaryOperationNode(node: UnaryOperationNode): void {
		if (node.position == 'left') {
			this.sb += node.operator;
			this.sb += ` `;
			this.walk(node.expression);
		} else {
			this.walk(node.expression);
			this.sb += ` `;
			this.sb += node.operator;
		}
	}

	protected walkUpdateCommandNode(node: UpdateCommandNode): void {
		this.sb += `UPDATE `;
		this.walk(node.table);
		this.sb += ` SET `;
		node.setItems.forEach(this.doListWalk());
		if (node.fromItems.length > 0) {
			this.sb += ` FROM `;
			node.fromItems.forEach(this.doListWalk());
		}
		if (node.conditions.length > 0) {
			this.sb += ` WHERE `;
			node.conditions.forEach(this.doListWalk());
		}
		if (node.returning) {
			this.sb += ` RETURNING `;
			node.returning.forEach(this.doListWalk());
		}
	}

	protected walkWithNode(node: WithNode): void {
		if (node.selectNodes.length > 0) {
			this.sb += `WITH `;
			for (let i = 0; i < node.selectNodes.length; i++) {
				const selectNode = node.selectNodes[i];
				if (i > 0) {
					this.sb += `, `;
				}
				// We can't use the normal alias expression walker, because CTEs specify the alias before the expression.
				this.sb += `"`;
				this.sb += selectNode.alias;
				this.sb += `" as `;
				this.walk(selectNode.expression);
			}
			this.sb += ` `;
		}
	}
}

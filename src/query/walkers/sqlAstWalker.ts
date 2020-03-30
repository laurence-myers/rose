import {
	AnyAliasedExpressionNode,
	AnyCommandNode,
	AstNode,
	BinaryOperationNode,
	BooleanExpression,
	BooleanExpressionGroupNode,
	ColumnReferenceNode,
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
	OrderByExpressionNode,
	SelectCommandNode,
	SetItemNode,
	SimpleColumnReferenceNode,
	SubSelectNode,
	TableReferenceNode,
	UnaryOperationNode,
	UpdateCommandNode,
	WithNode
} from "../ast";
import { assertNever, DefaultMap } from "../../lang";
import { UnsupportedOperationError } from "../../errors";
import { BaseWalker } from "./baseWalker";

interface PreparedQueryData {
	sql: string;
	parameterGetters: Array<(params: Object) => any>;
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
	protected parameterGetters: Array<(p: Object) => any> = [];

	constructor(
		protected queryAst: AnyCommandNode,
		protected tableMap: DefaultMap<string, string>
	) {
		super();
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

	protected walkBooleanExpressionGroupNode(node: BooleanExpressionGroupNode): void {
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

	protected walkBinaryOperationNode(node: BinaryOperationNode): void {
		this.walk(node.left);
		this.sb += ` `;
		this.sb += node.operator;
		this.sb += ` `;
		this.walk(node.right);
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		const tableAlias = node.tableAlias || this.tableMap.get(node.tableName);
		this.sb += `"`;
		this.sb += tableAlias;
		this.sb += `"."`;
		this.sb += node.columnName;
		this.sb += `"`;
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
			node.conditions.forEach(this.doItemWalk());
		}

		// TODO: support WHERE CURRENT OF

		// TODO: support RETURNING * or (aliased) output expressions
	}

	protected walkExpressionListNode(node: ExpressionListNode): void {
		this.sb += '(';
		node.expressions.forEach(this.doListWalk());
		this.sb += ')';
	}

	protected walkGroupByExpressionNode(node: GroupByExpressionNode): void {
		this.walk(node.expression);
	}

	protected walkJoinNode(node: JoinNode): void {
		const joinText = JOIN_TEXT_MAP[node.joinType];
		if (node.joinType == 'cross' && (node.on || (node.using && node.using.length > 0))) {
			throw new UnsupportedOperationError(`Cross joins cannot specify "on" or "using" conditions.`);
		}
		if (node.on && node.using && node.using.length > 0) {
			throw new UnsupportedOperationError(`Joins cannot specify both "on" and "using" conditions.`);
		}

		this.sb += joinText;
		this.sb += ` JOIN `;
		this.walk(node.fromItem);
		if (node.on) {
			this.sb += ` ON `;
			this.walk(node.on);
		} else if (node.using) {
			this.sb += ` USING `;
			node.using.forEach(this.doListWalk());
		}
		// TODO: support "natural"
	}

	protected walkFunctionExpressionNode(node: FunctionExpressionNode): void {
		this.sb += node.name;
		this.sb += '(';
		if (node.arguments.length > 0) {
			node.arguments.forEach(this.doListWalk());
		}
		this.sb += ')';
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
		}
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
		this.sb += node.name;
		this.sb += '(';
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
		this.sb += ')';
	}

	protected walkNotExpressionNode(node: NotExpressionNode): void {
		this.sb += `NOT (`;
		this.walk(node.expression);
		this.sb += `)`;
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
			this.sb += " ";
			node.joins.forEach(this.doItemWalk());
		}
		if (node.conditions.length > 0) {
			this.sb += " WHERE ";
			node.conditions.forEach(this.doItemWalk());
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
	}

	protected walkSetItemNode(node: SetItemNode): void {
		this.walk(node.column);
		this.sb += ` = `;
		this.walk(node.expression);
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
			node.fromItems.forEach(this.doListWalk());
		}
		if (node.conditions.length > 0) {
			this.sb += " WHERE ";
			node.conditions.forEach(this.doListWalk());
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

	prepare(): PreparedQueryData {
		this.walk(this.queryAst);
		return {
			sql: this.sb,
			parameterGetters: this.parameterGetters
		};
	}
}
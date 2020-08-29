import {
	AnyAliasedExpressionNode,
	AstNode,
	ColumnReferenceNode,
	SelectCommandNode,
	SubSelectNode,
	TableReferenceNode,
	WithNode
} from "../ast";
import { difference } from "../../lang";
import { SkippingWalker } from "./skippingWalker";
import { TableMap } from "../../data";

/**
 * Rectifies column references so they are always fully qualified, and all tables are aliased and also specified in a
 * "FROM" condition.
 */
class SelectRectifyingWalker extends SkippingWalker {
	protected readonly referencedTables: Set<string> = new Set<string>();
	protected readonly specifiedTables: Set<string> = new Set<string>();
	protected readonly columnReferences: Set<ColumnReferenceNode> = new Set<ColumnReferenceNode>();

	constructor(
		protected readonly ast: SelectCommandNode,
		protected readonly tableMap: TableMap = new TableMap()
	) {
		super();
	}

	protected walkAliasedExpressionNode(node: AnyAliasedExpressionNode) {
		if (node.expression.type === "subSelectNode" || node.expression.type === 'tableReferenceNode') {
			this.tableMap.set(node.alias, node.alias);
			this.specifiedTables.add(node.alias);
		}
		super.walkAliasedExpressionNode(node);
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		if (!node.tableAlias) {
			// Assume any un-aliased table needs to be rectified.
			this.referencedTables.add(node.tableName);
		}
		this.columnReferences.add(node);
		super.walkColumnReferenceNode(node);
	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		const subWalker = new SelectRectifyingWalker(node.query, node.tableMap);
		subWalker.rectify();
	}

	protected walkTableReferenceNode(node: TableReferenceNode): void {
		this.specifiedTables.add(node.tableName);
		super.walkTableReferenceNode(node);
	}

	protected walkWithNode(node: WithNode): void {
		// Do not process sub-nodes, they should be self-contained
	}

	rectify(): void {
		this.walk(this.ast);

		// Automatically add any unspecified tables to the "from" clause
		const unspecifiedTables = difference(this.referencedTables, this.specifiedTables);
		for (const tableName of unspecifiedTables) {
			const tableAlias = this.tableMap.get(tableName);
			this.ast.fromItems.push({
				type: "aliasedExpressionNode",
				alias: tableAlias,
				aliasPath: [tableAlias],
				expression: {
					type: "tableReferenceNode",
					tableName,
				}
			});
		}
		// Update all column references to use the aliases.
		for (const column of this.columnReferences.values()) {
			if (!column.tableAlias) {
				const tableAlias = this.tableMap.get(column.tableName);
				column.tableAlias = tableAlias;
			}
		}
	}
}

export class RectifyingWalker extends SkippingWalker {
	constructor(
		protected readonly ast: AstNode,
		protected readonly tableMap: TableMap = new TableMap()
	) {
		super();
	}

	protected walkSelectCommandNode(node: SelectCommandNode) {
		const subWalker = new SelectRectifyingWalker(node, this.tableMap);
		subWalker.rectify();
	}

	rectify(): void {
		this.walk(this.ast);
	}
}

import {
	AnyAliasedExpressionNode,
	AstNode,
	ColumnReferenceNode,
	FromItemFunctionNode,
	FromItemSubSelectNode,
	FromItemTableNode,
	FromItemWithNode,
	SelectCommandNode,
	SelectLockingNode,
	SubSelectNode,
	TableReferenceNode,
	WithNode,
} from "../ast";
import { difference } from "../../lang";
import { SkippingWalker } from "./skippingWalker";
import { TableMap } from "../../data";
import { from } from "../dsl";

/**
 * Rectifies column references so they are always fully qualified, and all tables are aliased and also specified in a
 * "FROM" condition.
 */
class SelectRectifyingWalker extends SkippingWalker {
	protected readonly referencedTables: Set<string> = new Set<string>();
	protected readonly columnReferences: Set<ColumnReferenceNode> =
		new Set<ColumnReferenceNode>();
	protected readonly subSelectNodes: SubSelectNode[] = [];
	protected readonly tableReferences: Set<TableReferenceNode> =
		new Set<TableReferenceNode>();
	protected readonly tableMap: TableMap = new TableMap();

	constructor(
		protected readonly ast: SelectCommandNode,
		protected readonly specifiedTables: Set<string> = new Set<string>()
	) {
		super();
	}

	protected walkAliasedExpressionNode(node: AnyAliasedExpressionNode) {
		if (node.expression.type === "subSelectNode") {
			this.tableMap.set(node.alias.name, node.alias.name);
			this.specifiedTables.add(node.alias.name);
		}
		super.walkAliasedExpressionNode(node);
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		this.referencedTables.add(node.tableOrAlias);
		this.columnReferences.add(node);
		super.walkColumnReferenceNode(node);
	}

	protected walkFromItemFunctionNode(node: FromItemFunctionNode) {
		if (node.alias) {
			this.tableMap.set(node.alias.name, node.alias.name);
			this.specifiedTables.add(node.alias.name);
		}
		super.walkFromItemFunctionNode(node);
	}

	protected walkFromItemSubSelectNode(node: FromItemSubSelectNode) {
		this.tableMap.set(node.alias.name, node.alias.name);
		this.specifiedTables.add(node.alias.name);
		super.walkFromItemSubSelectNode(node);
	}

	protected walkFromItemTableNode(node: FromItemTableNode) {
		let aliasNode = node.alias;
		if (!aliasNode) {
			const newAlias = this.tableMap.get(node.table);
			aliasNode = {
				type: "aliasNode",
				name: newAlias,
				path: [newAlias],
			};
			node.alias = aliasNode;
			this.tableMap.set(node.table, newAlias);
			this.specifiedTables.add(node.table);
		} else {
			this.tableMap.set(aliasNode.name, aliasNode.name);
			this.specifiedTables.add(aliasNode.name);
		}
		super.walkFromItemTableNode(node);
	}

	protected walkFromItemWithNode(node: FromItemWithNode) {
		if (node.alias) {
			this.tableMap.set(node.alias.name, node.alias.name);
			this.specifiedTables.add(node.alias.name);
		}
		super.walkFromItemWithNode(node);
	}

	protected walkSelectLockingNode(node: SelectLockingNode) {
		// TODO: better walking of referenced tables
		for (const tableNode of node.of) {
			// NOTE: we don't want to add it to FROM automatically; let it error at runtime.
			// this.referencedTables.add(tableNode.tableName);
			this.tableReferences.add(tableNode);
		}
	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		this.subSelectNodes.push(node);
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
		const unspecifiedTables = difference(
			this.referencedTables,
			this.specifiedTables
		);
		for (const tableName of unspecifiedTables) {
			const tableAlias = this.tableMap.get(tableName);
			this.ast.fromItems.push(
				from({
					type: "tableReferenceNode",
					tableName,
				})
					.alias(tableAlias)
					.toNode()
			);
			this.specifiedTables.add(tableAlias);
		}
		// Update all column references to use the aliases.
		for (const column of this.columnReferences.values()) {
			const tableAlias = this.tableMap.get(column.tableOrAlias);
			column.tableOrAlias = tableAlias;
		}
		// Update all table references to use the aliases.
		for (const tableNode of this.tableReferences.values()) {
			if (this.tableMap.has(tableNode.tableName)) {
				tableNode.tableName = this.tableMap.get(tableNode.tableName);
			}
		}

		// Now process nested sub-queries
		for (const node of this.subSelectNodes) {
			const subWalker = new SelectRectifyingWalker(
				node.query,
				this.specifiedTables
			);
			subWalker.rectify();
		}
	}
}

export class RectifyingWalker extends SkippingWalker {
	constructor(protected readonly ast: AstNode) {
		super();
	}

	protected walkSelectCommandNode(node: SelectCommandNode) {
		const subWalker = new SelectRectifyingWalker(node);
		subWalker.rectify();
	}

	rectify(): void {
		this.walk(this.ast);
	}
}

import { ColumnReferenceNode, SelectCommandNode, SubSelectNode, TableReferenceNode, WithNode } from "../ast";
import { DefaultMap, difference } from "../../lang";
import { SkippingWalker } from "./skippingWalker";

/**
 * Rectifies column references so they are always fully qualified, and all tables are aliased and also specified in a
 * "FROM" condition.
 */
export class RectifyingWalker extends SkippingWalker {
	protected referencedTables: Set<string> = new Set<string>();
	protected specifiedTables: Set<string> = new Set<string>();
	protected columnReferences: Set<ColumnReferenceNode> = new Set<ColumnReferenceNode>();

	constructor(
		protected ast: SelectCommandNode,
		protected tableMap: DefaultMap<string, string> = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`)
	) {
		super();
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		this.referencedTables.add(node.tableName);
		this.columnReferences.add(node);
		super.walkColumnReferenceNode(node);
	}

	protected walkSubSelectNode(node: SubSelectNode): void {
		const subWalker = new RectifyingWalker(node.query, this.tableMap);
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
		const unspecifiedTables = difference(this.referencedTables, this.specifiedTables);
		unspecifiedTables.forEach((tableName) => {
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
		});
		// Update all column references to use the aliases.
		for (const column of this.columnReferences.values()) {
			if (!column.tableAlias) {
				const tableAlias = this.tableMap.get(column.tableName);
				column.tableAlias = tableAlias;
			}
		}
	}
}

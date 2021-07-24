import {
	AstNode,
	ColumnReferenceNode,
	FromItemFunctionNode,
	FromItemSubSelectNode,
	FromItemTableNode,
	FromItemWithNode,
	SelectCommandNode,
	WithNode,
} from "../ast";
import { difference, union } from "../../lang";
import { SkippingWalker } from "./skippingWalker";
import { from } from "../dsl";

/**
 * Rectifies column references so they are always fully qualified, and all tables are aliased and also specified in a
 * "FROM" condition.
 */
class SelectRectifyingWalker extends SkippingWalker {
	protected readonly referencedTables: Set<string> = new Set<string>();
	protected readonly specifiedTables: Set<string> = new Set<string>();
	protected readonly subSelectNodes: SelectCommandNode[] = [];

	constructor(
		protected readonly ast: SelectCommandNode,
		protected readonly specifiedAliases: Set<string> = new Set<string>()
	) {
		super();
	}

	protected rectifySubQuery(node: SelectCommandNode) {
		const subWalker = new SelectRectifyingWalker(node, this.specifiedAliases);
		subWalker.rectify();
	}

	protected walkColumnReferenceNode(node: ColumnReferenceNode): void {
		this.referencedTables.add(node.tableOrAlias);
		super.walkColumnReferenceNode(node);
	}

	protected walkFromItemFunctionNode(node: FromItemFunctionNode) {
		if (node.alias) {
			this.specifiedTables.add(node.alias.name);
			this.specifiedAliases.add(node.alias.name);
		}
		super.walkFromItemFunctionNode(node);
	}

	protected walkFromItemSubSelectNode(node: FromItemSubSelectNode) {
		this.specifiedTables.add(node.alias.name);
		this.specifiedAliases.add(node.alias.name);
		super.walkFromItemSubSelectNode(node);
	}

	protected walkFromItemTableNode(node: FromItemTableNode) {
		this.specifiedTables.add(node.alias?.name || node.table);
		if (node.alias) {
			this.specifiedAliases.add(node.alias.name);
		}
		super.walkFromItemTableNode(node);
	}

	protected walkFromItemWithNode(node: FromItemWithNode) {
		if (node.alias) {
			this.specifiedTables.add(node.alias.name);
			this.specifiedAliases.add(node.alias.name);
		} else {
			this.specifiedTables.add(node.withQueryName);
			this.specifiedAliases.add(node.withQueryName);
		}
		super.walkFromItemWithNode(node);
	}

	protected walkSelectCommandNode(node: SelectCommandNode): void {
		if (node !== this.ast) {
			this.subSelectNodes.push(node);
		} else {
			super.walkSelectCommandNode(node);
		}
	}

	protected walkWithNode(node: WithNode): void {
		if (node.query.type === "selectCommandNode") {
			// Subqueries in WITH nodes should be processed immediately, as they provide context
			//  required in the subsequent query.
			this.rectifySubQuery(node.query);
		}
		// TODO: support other types of queries
	}

	rectify(): void {
		this.walk(this.ast);

		// Automatically add any unspecified tables to the "from" clause
		const unspecifiedTables = difference(
			this.referencedTables,
			union(this.specifiedAliases, this.specifiedTables)
		);
		for (const tableName of unspecifiedTables) {
			this.ast.fromItems.push(from(tableName).toNode());
			this.specifiedTables.add(tableName);
		}

		// Now process nested sub-queries
		for (const node of this.subSelectNodes) {
			this.rectifySubQuery(node);
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

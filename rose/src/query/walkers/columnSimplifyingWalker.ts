import { SkippingWalker } from "./skippingWalker";
import {
	AstNode,
	ColumnReferenceNode,
	SimpleColumnReferenceNode,
} from "../ast";

/**
 * Converts ColumnReferenceNodes to SimpleColumnReferenceNodes.
 */
export class ColumnSimplifyingWalker extends SkippingWalker {
	protected walkColumnReferenceNode(node: ColumnReferenceNode) {
		// Hack to replace the object's contents. Probably should think of a better way to do this.
		delete (node as any).tableOrAlias;
		(node as ColumnReferenceNode | SimpleColumnReferenceNode).type =
			"simpleColumnReferenceNode";
	}

	simplify(node: AstNode) {
		this.walk(node);
	}
}

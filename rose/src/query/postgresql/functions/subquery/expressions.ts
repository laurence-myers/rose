import { SubSelectNode, UnaryOperationNode } from "../../../ast";
import { createUnaryOperatorNode } from "../common/helpers";

export function exists(subquery: SubSelectNode): UnaryOperationNode {
	return createUnaryOperatorNode("EXISTS", "left", subquery);
}
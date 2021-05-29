import { BooleanUnaryOperationNode, SubSelectNode } from "../../../ast";
import { createBooleanUnaryOperatorNode } from "../common/helpers";

export function exists(subquery: SubSelectNode): BooleanUnaryOperationNode {
	return createBooleanUnaryOperatorNode("EXISTS", "left", subquery);
}

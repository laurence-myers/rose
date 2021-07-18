import {
	AliasedExpressionNode,
	AstNode,
	FromItemJoinNode,
	FromItemNode,
	FunctionExpressionNode,
	SubSelectNode,
	TableReferenceNode,
} from "../ast";
import { QueryTable } from "../metamodel";
import {
	AliasedSubQueryBuilder,
	BuildableJoin,
	CommonTableExpressionBuilder,
} from "../builders";
import {
	Fromable,
	FromFunctionBuilder,
	FromSubSelectBuilder,
	FromTableBuilder,
	FromWithBuilder,
} from "../builders/from";
import { alias } from "./core";

function isAliasedSubQuery(
	aliasedExpression: AstNode
): aliasedExpression is AliasedExpressionNode<SubSelectNode> {
	return (
		aliasedExpression.type === "aliasedExpressionNode" &&
		aliasedExpression.expression.type === "subSelectNode"
	);
}

export function from(fromable: BuildableJoin): FromItemJoinNode;
export function from(
	fromable: QueryTable | TableReferenceNode
): FromTableBuilder;
export function from(
	fromable: AliasedSubQueryBuilder<any> | AliasedExpressionNode<SubSelectNode>
): FromSubSelectBuilder;
export function from(
	fromable: CommonTableExpressionBuilder<any>
): FromWithBuilder;
export function from(
	fromable: FunctionExpressionNode | FunctionExpressionNode[]
): FromFunctionBuilder;
export function from(fromable: FromItemNode): FromItemNode;
export function from(
	fromable: Fromable
):
	| FromTableBuilder
	| FromSubSelectBuilder
	| FromWithBuilder
	| FromFunctionBuilder
	| FromItemNode;
export function from(
	fromable: Fromable
):
	| FromTableBuilder
	| FromSubSelectBuilder
	| FromWithBuilder
	| FromFunctionBuilder
	| FromItemNode {
	if (fromable instanceof QueryTable) {
		return new FromTableBuilder(
			fromable.$table.toNode(),
			fromable.$table.alias ? alias(fromable.$table.alias) : undefined
		);
	} else if (fromable instanceof CommonTableExpressionBuilder) {
		return new FromWithBuilder(fromable.alias);
	} else if (fromable instanceof AliasedSubQueryBuilder) {
		const node = fromable.toNode();
		return new FromSubSelectBuilder(node.expression, node.alias);
	} else if (Array.isArray(fromable)) {
		// assumes all items are function expressions
		return new FromFunctionBuilder(fromable);
	} else if (fromable instanceof BuildableJoin) {
		return fromable.build();
	} else if (fromable.type === "tableReferenceNode") {
		return new FromTableBuilder(fromable);
	} else if (isAliasedSubQuery(fromable)) {
		return new FromSubSelectBuilder(fromable.expression, fromable.alias);
	} else if (fromable.type === "functionExpressionNode") {
		return new FromFunctionBuilder([fromable]);
	} else {
		return fromable;
	}
}

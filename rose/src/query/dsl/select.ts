import { QuerySelector, SelectorExpression, SelectorNestedMany, SelectorNestedOne } from "../querySelector";
import {
	AliasedSubQueryBuilder,
	CommonTableExpressionBuilder,
	SubQueryBuilder,
	SubSelectExpression
} from "../builders/select";
import { ParameterOrValueExpressionNode } from "../ast";

export function selectCte<TQuerySelector extends QuerySelector>(alias: string, querySelector: TQuerySelector) {
	return new CommonTableExpressionBuilder(alias, querySelector);
}

export function selectExpression<T = never>(expression: ParameterOrValueExpressionNode): SelectorExpression<T> {
	return {
		$selectorKind: 'expression',
		expression
	};
}

export function selectNestedMany<T extends QuerySelector>(querySelector: T): SelectorNestedMany<T> {
	return {
		$selectorKind: 'nestedMany',
		nestedSelector: {
			querySelector
		}
	};
}

export function selectNestedOne<T extends QuerySelector>(querySelector: T): SelectorNestedOne<T> {
	return {
		$selectorKind: 'nestedOne',
		nestedSelector: {
			querySelector
		}
	};
}

export function subSelect<TParams>(...outputExpressions: SubSelectExpression[]) {
	return new SubQueryBuilder<TParams>(outputExpressions);
}

export function selectSubQuery<TQuerySelector extends QuerySelector>(alias: string, querySelector: TQuerySelector) {
	return new AliasedSubQueryBuilder(alias, querySelector);
}

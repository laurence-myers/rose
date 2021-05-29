import { QuerySelector, SelectorExpression, SelectorNestedMany, SelectorNestedOne } from "../querySelector";
import {
	AliasedSubQueryBuilder,
	CommonTableExpressionBuilder,
	SelectQueryBuilder,
	SubQueryBuilder,
	SubSelectExpression
} from "../builders/select";
import { ParameterOrValueExpressionNode } from "../ast";
import { exists } from "./postgresql";
import { constant } from "./core";

export function selectCte<TQuerySelector extends QuerySelector>(alias: string, querySelector: TQuerySelector) {
	return new CommonTableExpressionBuilder(alias, querySelector);
}

export function selectExpression<T = never>(expression: ParameterOrValueExpressionNode): SelectorExpression<T> {
	return {
		$selectorKind: 'expression',
		expression
	};
}

interface SelectExistsQuerySelector extends QuerySelector {
	exists: {
		readonly $selectorKind: 'expression';
		readonly expression: ParameterOrValueExpressionNode;
	}
}

export function selectExists(
	subQueryBuilderCallback: <TParams>(builder: SubQueryBuilder<TParams>) => SubQueryBuilder<TParams>
): SelectQueryBuilder<SelectExistsQuerySelector> {
	return new SelectQueryBuilder<SelectExistsQuerySelector>({
		exists: selectExpression(
			exists(
				subQueryBuilderCallback(subSelect(constant(1)))
					.toSubQuery()
			)
		)
	});
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

/**
 * Creates an aliased sub-query
 */
export function selectSubQuery<TQuerySelector extends QuerySelector>(alias: string, querySelector: TQuerySelector) {
	return new AliasedSubQueryBuilder(alias, querySelector);
}

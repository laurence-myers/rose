import {BooleanColumnMetamodel, DateColumnMetamodel, NumericColumnMetamodel, StringColumnMetamodel} from "./metamodel";
import {ParameterOrValueExpressionNode} from "./ast";

export type SelectorColumnTypes = (
	BooleanColumnMetamodel |
	DateColumnMetamodel |
	NumericColumnMetamodel |
	StringColumnMetamodel
);

export interface SelectorExpression {
	readonly $selectorKind : 'expression';
	readonly expression : ParameterOrValueExpressionNode;
}

export class NestedQuery {
	constructor(
		public readonly querySelector : QuerySelector,
		public readonly constructor : Function,
		public readonly isArray : boolean
	) {

	}
}

export interface SelectorNested {
	readonly $selectorKind : 'nested';
	readonly nestedSelector : NestedQuery;
}

export type SelectorTypes = (
	SelectorColumnTypes
	| SelectorExpression
	| SelectorNested
);

export type SelectorKind = 'column' | 'expression' | 'nested';

export interface QuerySelector {
	[key: string] : SelectorTypes;
}

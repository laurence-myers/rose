import {
	QuerySelector,
	SelectorColumnTypes,
	SelectorExpression,
	SelectorNestedMany,
	SelectorNestedOne,
} from "./querySelector";
import { ColumnMetamodel } from "./metamodel";

export type MappableTypes =
	| QuerySelector
	| SelectorColumnTypes
	| SelectorExpression<any>
	| SelectorNestedOne<any>
	| SelectorNestedMany<any>;

export type MappedQuerySelector<TQS extends MappableTypes> = {
	[K in keyof TQS]: TQS[K] extends MappableTypes ? QueryOutput<TQS[K]> : never;
};

export type QueryOutput<T extends MappableTypes> = T extends QuerySelector
	? MappedQuerySelector<T>
	: T extends ColumnMetamodel<infer U>
	? U
	: T extends SelectorExpression<infer U>
	? U
	: T extends SelectorNestedOne<infer U>
	? U extends QuerySelector
		? MappedQuerySelector<U>[]
		: never // TODO: "nested one" should return an object, not an array containing one object
	: T extends SelectorNestedMany<infer U>
	? U extends QuerySelector
		? MappedQuerySelector<U>[]
		: never
	: never;

import {
	BuildableJoin,
	InitialJoinBuilder,
	Joinable,
	OnOrUsingJoinBuilder,
} from "../builders/join";
import { QuerySelector } from "../querySelector";

export function join<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): InitialJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(queryTable);
}

export function fullJoin<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(queryTable).full();
}

export function innerJoin<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(queryTable).inner();
}

export function leftJoin<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(queryTable).left();
}

export function rightJoin<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): OnOrUsingJoinBuilder<TQuerySelector> {
	return new InitialJoinBuilder(queryTable).right();
}

export function crossJoin<TQuerySelector extends QuerySelector>(
	queryTable: Joinable<TQuerySelector>
): BuildableJoin<TQuerySelector> {
	return new InitialJoinBuilder(queryTable).cross();
}

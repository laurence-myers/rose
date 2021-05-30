import { QueryTable } from "../metamodel";
import {
	BuildableJoin,
	InitialJoinBuilder,
	OnOrUsingJoinBuilder,
} from "../builders/join";

export function join(queryTable: QueryTable): InitialJoinBuilder {
	return new InitialJoinBuilder(queryTable);
}

export function fullJoin(queryTable: QueryTable): OnOrUsingJoinBuilder {
	return new InitialJoinBuilder(queryTable).full();
}

export function innerJoin(queryTable: QueryTable): OnOrUsingJoinBuilder {
	return new InitialJoinBuilder(queryTable).inner();
}

export function leftJoin(queryTable: QueryTable): OnOrUsingJoinBuilder {
	return new InitialJoinBuilder(queryTable).left();
}

export function rightJoin(queryTable: QueryTable): OnOrUsingJoinBuilder {
	return new InitialJoinBuilder(queryTable).right();
}

export function crossJoin(queryTable: QueryTable): BuildableJoin {
	return new InitialJoinBuilder(queryTable).cross();
}

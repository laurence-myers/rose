import { InvalidQuerySelectorError } from "../errors";
import {
	AliasedSelectExpressionNode,
	ParameterOrValueExpressionNode,
	SelectOutputExpression,
} from "./ast";
import { assertNever } from "../lang";
import { ColumnMetamodel } from "./metamodel";
import {
	NestedQueryMany,
	NestedQueryOne,
	QuerySelector,
	SelectorColumnTypes,
} from "./querySelector";

export class QuerySelectorProcessor {
	protected outputExpressions: Array<SelectOutputExpression> = [];

	constructor(protected querySelector: QuerySelector) {}

	protected processColumnEntries(
		entries: Iterable<[string, SelectorColumnTypes]>,
		aliasPath: string[]
	): void {
		for (const entry of entries) {
			const columnMetamodel: ColumnMetamodel<any> = entry[1];
			const fullPath = aliasPath.concat(entry[0]);
			const columnAlias: string = fullPath.join(".");

			this.outputExpressions.push({
				type: "aliasedExpressionNode",
				alias: columnAlias,
				aliasPath: fullPath,
				expression: columnMetamodel.toColumnReferenceNode(),
			});
		}
	}

	protected processNestedEntries(
		entries: Iterable<[string, NestedQueryOne | NestedQueryMany]>,
		aliasPath: string[]
	): void {
		for (const entry of entries) {
			const aliasPrefix: string = entry[0];
			const nestedQuery: NestedQueryOne | NestedQueryMany = entry[1];
			this.processSelectQueryClass(
				nestedQuery.querySelector,
				aliasPath.concat(aliasPrefix)
			);
		}
	}

	protected processExpressionEntries(
		entries: Iterable<[string, ParameterOrValueExpressionNode]>,
		aliasPath: string[]
	): void {
		for (const entry of entries) {
			const fullPath = aliasPath.concat(entry[0]);
			const columnAlias: string = fullPath.join(".");
			const expression: ParameterOrValueExpressionNode = entry[1];
			// TODO: resolve table references within the expression?
			// TODO: support the property name as the alias
			const aliasedExpressionNode: AliasedSelectExpressionNode = {
				type: "aliasedExpressionNode",
				alias: columnAlias,
				aliasPath: fullPath,
				expression,
			};
			this.outputExpressions.push(aliasedExpressionNode);
		}
	}

	protected getAllEntries(querySelector: QuerySelector) {
		const columns = [];
		const expressions = [];
		const nesteds = [];
		for (const key of Object.keys(querySelector)) {
			const value = querySelector[key];
			switch (value.$selectorKind) {
				case "column": {
					const columnEntry: [string, SelectorColumnTypes] = [key, value];
					columns.push(columnEntry);
					break;
				}
				case "expression": {
					const expressionEntry: [string, ParameterOrValueExpressionNode] = [
						key,
						value.expression,
					];
					expressions.push(expressionEntry);
					break;
				}
				case "nestedOne":
				case "nestedMany": {
					const nestedEntry: [string, NestedQueryOne | NestedQueryMany] = [
						key,
						value.nestedSelector,
					];
					nesteds.push(nestedEntry);
					break;
				}
				default:
					throw assertNever(value);
			}
		}
		return {
			columns,
			expressions,
			nesteds,
		};
	}

	protected processSelectQueryClass(
		querySelector: QuerySelector,
		aliasPath: string[]
	): void {
		const allEntries = this.getAllEntries(querySelector);
		const columnEntries = allEntries.columns;
		if (columnEntries) {
			this.processColumnEntries(columnEntries, aliasPath);
		}
		const nestedEntries = allEntries.nesteds;
		if (nestedEntries) {
			this.processNestedEntries(nestedEntries, aliasPath);
		}
		const expressionEntries = allEntries.expressions;
		if (expressionEntries) {
			this.processExpressionEntries(expressionEntries, aliasPath);
		}
		if (
			!columnEntries.length &&
			!nestedEntries.length &&
			!expressionEntries.length
		) {
			throw new InvalidQuerySelectorError(
				"The selector object provided to the select function does not have any output columns, expressions, or nested queries."
			);
		}
	}

	process(): Array<SelectOutputExpression> {
		this.processSelectQueryClass(this.querySelector, []);
		return this.outputExpressions;
	}
}

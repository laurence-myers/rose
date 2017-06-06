import {InvalidQueryClassError} from "../errors";
import {EXPRESSION_METADATA_KEY, NESTED_METADATA_KEY, NestedQuery} from "./dsl";
import {AliasedExpressionNode, FunctionExpressionNode, SelectOutputExpression, ValueExpressionNode} from "./ast";
import {getMetadata} from "../lang";
import {ColumnMetamodel, SELECT_METADATA_KEY} from "./metamodel";

export interface QueryClass {
	new() : any;
}

export class SelectMetadataProcessor {
	protected outputExpressions : Array<SelectOutputExpression> = [];

	constructor(
		protected queryClass : QueryClass
	) {

	}

	protected processSelectMetadata(entries : IterableIterator<[string, ColumnMetamodel<any>]>, aliasPrefix? : string) : void {
		for (const entry of entries) {
			const columnMetamodel : ColumnMetamodel<any> = entry[1];
			const columnAlias : string = aliasPrefix ? `${ aliasPrefix }.${ entry[0] }` : entry[0];

			this.outputExpressions.push({
				type: 'aliasedExpressionNode',
				alias: columnAlias,
				expression: columnMetamodel.toColumnReferenceNode()
			});
		}
	}

	protected processNestedMetadata(entries : IterableIterator<[string, NestedQuery]>) : void {
		for (const entry of entries) {
			const aliasPrefix : string = entry[0];
			const nestedQuery : NestedQuery = entry[1];
			this.processSelectQueryClass(nestedQuery.queryClass, aliasPrefix);
		}
	}

	protected processExpressionMetadata(entries : IterableIterator<[string, ValueExpressionNode]>) : void {
		for (const entry of entries) {
			const alias : string = entry[0];
			const expression : ValueExpressionNode = entry[1];
			// TODO: resolve table references within the expression?
			// TODO: support the property name as the alias
			const aliasedExpressionNode : AliasedExpressionNode = {
				type: 'aliasedExpressionNode',
				alias,
				expression
			};
			this.outputExpressions.push(aliasedExpressionNode);
		}
	}

	protected getSelectMetadata(queryClass : Function) : Map<string, ColumnMetamodel<any>> | undefined {
		const selectMetadata = getMetadata<Map<string, ColumnMetamodel<any>>>(SELECT_METADATA_KEY, queryClass.prototype);
		return selectMetadata;
	}

	protected processSelectQueryClass(queryClass : Function, aliasPrefix? : string) : void {
		const selectMetadata = this.getSelectMetadata(queryClass);
		if (selectMetadata) {
			this.processSelectMetadata(selectMetadata.entries(), aliasPrefix);
		}
		const nestedMetadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, queryClass.prototype);
		if (nestedMetadata) {
			this.processNestedMetadata(nestedMetadata.entries());
		}
		const expressionMetadata = getMetadata<Map<string, FunctionExpressionNode>>(EXPRESSION_METADATA_KEY, queryClass.prototype);
		if (expressionMetadata) {
			this.processExpressionMetadata(expressionMetadata.entries());
		}
		if (!selectMetadata && !nestedMetadata && !expressionMetadata) {
			throw new InvalidQueryClassError("The class provided to the select function does not have any output columns, expressions, or nested queries.");
		}
	}

	process() : Array<SelectOutputExpression> {
		this.processSelectQueryClass(this.queryClass);
		return this.outputExpressions;
	}
}

export function getNestedPropertyNames(queryClass : Function) : string[] {
	const nestedMetadata = getMetadata<Map<string, NestedQuery>>(NESTED_METADATA_KEY, queryClass.prototype);
	if (nestedMetadata) {
		return Array.from(nestedMetadata.keys());
	} else {
		return [];
	}
}
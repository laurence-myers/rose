import { AtLeastOne, Clone, DefaultMap } from "../../lang";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ParameterOrValueExpressionNode,
	SelectOutputExpression,
	TableReferenceNode,
	UpdateCommandNode
} from "../ast";
import { QueryTable, TableColumnsForUpdateCommand } from "../metamodel";
import { aliasTable } from "../dsl";
import { GeneratedQuery, PreparedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { Queryable } from "../../execution/execution";
import { SqlAstWalker } from "../walkers/sqlAstWalker";
import { QuerySelector } from "../querySelector";
import { QuerySelectorProcessor } from "../metadata";
import { MappedQuerySelector } from "../typeMapping";

export class UpdateQueryBuilder<TQTable extends QueryTable, TParams> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst: UpdateCommandNode;

	constructor(
		protected readonly qtable: TQTable
	) {
		this.queryAst = {
			type: 'updateCommandNode',
			table: this.fromSingleTable(qtable),
			setItems: [],
			fromItems: [],
			conditions: [],
		};
	}

	protected fromSingleTable(qtable: QueryTable): AliasedExpressionNode<TableReferenceNode> {
		const tableName = qtable.$table.name;
		const alias = qtable.$table.alias || this.tableMap.get(tableName);
		return aliasTable(tableName, alias);
	}

	@Clone()
	from(first: QueryTable, ...rest: QueryTable[]): this {
		for (const qtable of [first].concat(rest)) {
			this.queryAst.fromItems.push(this.fromSingleTable(qtable));
		}
		return this;
	}

	returning<TQuerySelector extends QuerySelector>(querySelector: TQuerySelector): UpdateReturningQueryBuilder<TQTable, TQuerySelector, TParams> {
		return new UpdateReturningQueryBuilder<TQTable, TQuerySelector, TParams>(
			this.qtable,
			this.tableMap,
			this.queryAst,
			querySelector
		);
	}

	@Clone()
	set(updates: AtLeastOne<Partial<TableColumnsForUpdateCommand<TQTable>>>): this {
		for (const column of Object.keys(updates)) {
			const expression: ParameterOrValueExpressionNode = (updates as any)[column];
			this.queryAst.setItems.push({
				type: 'setItemNode',
				column: {
					type: 'simpleColumnReferenceNode',
					columnName: column,
				},
				expression,
			});
		}
		return this;
	}

	@Clone()
	where(whereExpression: BooleanExpression): this {
		this.queryAst.conditions.push(whereExpression);
		return this;
	}

	prepare(): PreparedQueryNonReturning<TParams> {
		const walker = new SqlAstWalker(this.queryAst, this.tableMap);
		const data = walker.prepare();
		return new PreparedQueryNonReturning<TParams>(data.sql, data.parameterGetters);
	}

	toSql(params: TParams): GeneratedQuery {
		return this.prepare()
			.generate(params);
	}

	execute(queryable: Queryable, params: TParams): Promise<void> {
		return this.prepare()
			.execute(queryable, params);
	}
}

export class UpdateReturningQueryBuilder<TQTable extends QueryTable, TQuerySelector extends QuerySelector, TParams> {
	constructor(
		protected readonly qtable: TQTable,
		protected readonly tableMap: DefaultMap<string, string>,
		protected readonly queryAst: UpdateCommandNode,
		protected readonly querySelector: TQuerySelector,
	) {
		this.queryAst.returning = this.processQuerySelector(querySelector);
	}

	protected processQuerySelector(querySelector: QuerySelector): Array<SelectOutputExpression> {
		const processor = new QuerySelectorProcessor(querySelector);
		return processor.process();
	}

	prepare(): PreparedQuery<TQuerySelector, TParams> {
		const querySelector = this.querySelector;
		const walker = new SqlAstWalker(this.queryAst, this.tableMap);
		const data = walker.prepare();
		return new PreparedQuery<typeof querySelector, TParams>(querySelector, this.queryAst.returning || [], data.sql, data.parameterGetters);
	}

	toSql(params: TParams): GeneratedQuery {
		return this.prepare()
			.generate(params);
	}

	execute(queryable: Queryable, params: TParams): Promise<MappedQuerySelector<TQuerySelector>[]> {
		return this.prepare()
			.execute(queryable, params);
	}
}

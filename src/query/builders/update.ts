import { AtLeastOne, Clone, DefaultMap } from "../../lang";
import {
	AliasedExpressionNode,
	BooleanExpression,
	ParameterOrValueExpressionNode,
	TableReferenceNode,
	UpdateCommandNode
} from "../ast";
import { QueryTable, TableColumnsForUpdateCommand } from "../metamodel";
import { aliasTable } from "../dsl";
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { Queryable } from "../../execution/execution";
import { SqlAstWalker } from "../walkers/sqlAstWalker";

export class UpdateQueryBuilder<TQTable extends QueryTable, TParams> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst: UpdateCommandNode;

	constructor(
		qtable: TQTable
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

	@Clone()
	set(updates: AtLeastOne<TableColumnsForUpdateCommand<TQTable>>): this {
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

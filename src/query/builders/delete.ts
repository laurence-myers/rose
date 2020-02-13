import { Clone, DefaultMap } from "../../lang";
import { AliasedExpressionNode, BooleanExpression, DeleteCommandNode, TableReferenceNode } from "../ast";
import { QueryTable } from "../metamodel";
import { GeneratedQuery, PreparedQueryNonReturning } from "../preparedQuery";
import { Queryable } from "../../execution/execution";
import { aliasTable } from "../dsl/core";
import { SqlAstWalker } from "../walkers/sqlAstWalker";

export class DeleteQueryBuilder<TParams> {
	protected tableMap = new DefaultMap<string, string>((key, map) => `t${ map.size + 1 }`);
	protected queryAst: DeleteCommandNode;

	constructor(
		qtable: QueryTable
	) {
		this.queryAst = {
			type: 'deleteCommandNode',
			from: this.from(qtable),
			conditions: [],
		};
	}

	protected from(qtable: QueryTable): AliasedExpressionNode<TableReferenceNode> {
		const tableName = qtable.$table.name;
		const alias = qtable.$table.alias || this.tableMap.get(tableName);
		return aliasTable(tableName, alias);
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

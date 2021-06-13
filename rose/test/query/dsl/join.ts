import { doSimpleSqlTest } from "../../test-utils";
import { QProject, QProjectRole } from "../../fixtures";
import { leftJoin, selectCte, selectSubQuery } from "../../../src";
import { TableMap } from "../../../src/data";

describe(`Joins`, () => {
	describe(`leftJoin()`, () => {
		it(`should accept a QueryTable`, () => {
			const astNode = leftJoin(QProjectRole)
				.on(QProjectRole.projectId.eq(QProject.projectId))
				.build(new TableMap());

			const expected = `LEFT OUTER JOIN "project_role" as "t1" ON "t1"."project_id" = "t2"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});

		it(`should accept a subquery`, () => {
			const sq = selectSubQuery("sq1", {
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			});
			const tableMap = new TableMap();
			const astNode = leftJoin(sq)
				.on(sq.toMetamodel().projectId.eq(QProject.projectId))
				.build(tableMap);

			const expected = `LEFT OUTER JOIN (SELECT "t1"."project_id" as "projectId", "t1"."role" as "role" FROM "project_role" as "t1") as "sq1" ON "sq1"."projectId" = "t1"."project_id"`;

			doSimpleSqlTest(astNode, expected, tableMap);
		});

		it(`should accept a reference to a Common Table Expression (CTE)`, () => {
			const cte = selectCte("cte1", {
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			});
			const tableMap = new TableMap();
			const cteMetamodel = cte.toMetamodel();
			const astNode = leftJoin(cte)
				.on(cteMetamodel.projectId.eq(QProject.projectId))
				.build(tableMap);

			const expected = `LEFT OUTER JOIN "cte1" ON "cte1"."projectId" = "t1"."project_id"`;

			doSimpleSqlTest(astNode, expected, tableMap);
		});
	});
});

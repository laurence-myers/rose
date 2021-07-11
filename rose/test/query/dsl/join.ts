import { doSimpleSqlTest } from "../../test-utils";
import { QProject, QProjectRole } from "../../fixtures";
import { leftJoin, selectCte, selectSubQuery } from "../../../src";
import { TableMap } from "../../../src/data";

describe(`Joins`, () => {
	describe(`leftJoin()`, () => {
		it(`should accept a QueryTable`, () => {
			const astNode = leftJoin(QProject, QProjectRole)
				.on(QProjectRole.projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" as "t1" LEFT OUTER JOIN "project_role" as "t2" ON "t2"."project_id" = "t1"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});

		it(`should accept a subquery`, () => {
			const sq = selectSubQuery("sq1", {
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			});
			const astNode = leftJoin(QProject, sq)
				.on(sq.toMetamodel().projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" as "t1" LEFT OUTER JOIN (SELECT "t1"."project_id" as "projectId", "t1"."role" as "role" FROM "project_role" as "t1") as "sq1" ON "sq1"."projectId" = "t1"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});

		it(`should accept a reference to a Common Table Expression (CTE)`, () => {
			const cte = selectCte("cte1", {
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			});
			const cteMetamodel = cte.toMetamodel();
			const astNode = leftJoin(QProject, cte)
				.on(cteMetamodel.projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" as "t1" LEFT OUTER JOIN "cte1" ON "cte1"."projectId" = "t1"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});
	});
});

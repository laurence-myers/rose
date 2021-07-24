import { doSimpleSqlTest } from "../../test-utils";
import { QProject, QProjectRole } from "../../fixtures";
import { leftJoin, withCte, selectSubQuery, select } from "../../../src";

describe(`Joins`, () => {
	describe(`leftJoin()`, () => {
		it(`should accept a QueryTable`, () => {
			const astNode = leftJoin(QProject, QProjectRole)
				.on(QProjectRole.projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" LEFT OUTER JOIN "project_role" ON "project_role"."project_id" = "project"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});

		it(`should accept a subquery`, () => {
			const sq = selectSubQuery("sq1", {
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			}).from(QProjectRole);
			const astNode = leftJoin(QProject, sq)
				.on(sq.toMetamodel().projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" LEFT OUTER JOIN (SELECT "project_role"."project_id" as "projectId", "project_role"."role" as "role" FROM "project_role") as "sq1" ON "sq1"."projectId" = "project"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});

		it(`should accept a reference to a Common Table Expression (CTE)`, () => {
			const selectQuery = select({
				projectId: QProjectRole.projectId,
				role: QProjectRole.role,
			});
			const cteName = "cte1";
			const cte = withCte(cteName, selectQuery);
			const cteMetamodel = selectQuery.toMetamodel(cteName);
			const astNode = leftJoin(QProject, cte)
				.on(cteMetamodel.projectId.eq(QProject.projectId))
				.build();

			const expected = `"project" LEFT OUTER JOIN "cte1" ON "cte1"."projectId" = "project"."project_id"`;

			doSimpleSqlTest(astNode, expected);
		});
	});
});

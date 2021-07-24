import {
	QBuilderTemplateCategories,
	QBuilderTemplates,
	QBuilderTemplateTags,
	QBuilderTemplateToCategoryMap,
	QLocations,
	QOrders,
	QRecurringPayments,
	QTags,
	QUploads,
} from "../fixtures";
import { select } from "../../src/query/dsl/commands";
import {
	now,
	overlaps,
} from "../../src/query/dsl/postgresql/dateTime/functions";
import * as assert from "assert";
import { exists } from "../../src/query/dsl/postgresql/subquery/expressions";
import { sum } from "../../src/query/dsl/postgresql/aggregate/general";
import { divide } from "../../src/query/dsl/postgresql/mathematical/operators";
import {
	selectExpression,
	selectNestedMany,
	subSelect,
} from "../../src/query/dsl/select";
import { and, col, constant, literal, or } from "../../src/query/dsl/core";
import { params, withParams } from "../../src/query/params";
import { withCte } from "../../src/query/dsl/with";

describe(`Example queries`, function () {
	describe(`Recurring payments`, function () {
		/**
		 SELECT DISTINCT ON ("locationId")
		   *
		 FROM
		   "RecurringPayments"
		 JOIN "Locations" as loc ON loc."id" = "locationId"
		 WHERE
		   "nextDate" >= :now
		 AND loc."clientId" = :clientId
		 AND (
		   "endDate" IS NULL
		   OR "endDate" > "nextDate"
		 )
		 ORDER BY "locationId", "nextDate" ASC;
		 */
		it(`find the next active payment for all locations under a given client`, function () {
			const QRP = QRecurringPayments; // alias for brevity
			const querySelect = {
				id: QRP.id,

				locationId: QLocations.id,
			};
			const params = {
				clientId: 123,
			};
			const query = withParams<{ clientId: number }>()((p) =>
				select(querySelect)
					.distinctOn(col(QRP.locationId))
					.from(
						QRP.$table
							.innerJoin(QLocations)
							.on(QLocations.id.eq(QRP.locationId))
					)
					.where(
						and(
							QRP.nextDate.gte(now()),
							QLocations.clientId.eq(p.clientId),
							or(QRP.endDate.isNull(), QRP.endDate.gt(QRP.nextDate))
						)
					)
					.orderBy(QRP.locationId.asc(), QRP.nextDate.asc())
					.finalise(p)
			);

			const result = query.toSql(params);

			const expected =
				"SELECT DISTINCT ON " +
				'("RecurringPayments"."locationId") ' +
				'"RecurringPayments"."id" as "id", "Locations"."id" as "locationId" ' +
				'FROM "RecurringPayments" ' +
				'INNER JOIN "Locations" ON "Locations"."id" = "RecurringPayments"."locationId" ' +
				"WHERE " +
				'("RecurringPayments"."nextDate" >= now() AND ' +
				'"Locations"."clientId" = $1 AND ' +
				'("RecurringPayments"."endDate" IS NULL OR ' +
				'"RecurringPayments"."endDate" > "RecurringPayments"."nextDate")) ' +
				'ORDER BY "RecurringPayments"."locationId" ASC, "RecurringPayments"."nextDate" ASC';
			assert.equal(result.sql, expected);
		});

		/**
		 SELECT
		 EXISTS
		 (
			 SELECT
			 	*
			 FROM
			 	"RecurringPayments"
			 WHERE
			 	"locationId" = :locationId
			 AND (
		 		(
			 		"endDate" IS NULL
			 		AND "startDate" = :startDate
		 		)
			 	OR ("startDate", "endDate") OVERLAPS (:startDate, :endDate)
		 	)
			 LIMIT 1
		 ) AS "exists";
		 */
		it(`there exists a payment with a date range overlapping the given dates and location`, function () {
			const QRP = QRecurringPayments; // alias for brevity

			// Make our parameters type safe
			interface QueryParams {
				startDate: Date;
				endDate: Date;
				locationId: number;
			}
			// Make our use of parameters within the sub-query type safe
			const P = params<QueryParams>();
			// Define our sub-query before the query class. (We could also define it inline, at the expense of readability.)
			const subQuery = subSelect<QueryParams>(QRP.id)
				.where(
					and(
						QRP.locationId.eq(P.locationId),
						or(
							and(QRP.endDate.isNull(), QRP.startDate.eq(P.startDate)),
							overlaps(
								col(QRP.startDate),
								col(QRP.endDate),
								P.startDate,
								P.endDate
							)
						)
					)
				)
				.limit(constant(1))
				.toNode();
			// Make the returned values type safe.
			const querySelect = {
				exists: selectExpression(exists(subQuery)),
			};

			const query = select(querySelect).finalise(P);

			const result = query.toSql({
				startDate: new Date(Date.parse("2017-05-11")),
				endDate: new Date(Date.parse("2017-06-11")),
				locationId: 123,
			});

			const expected =
				"SELECT EXISTS (" +
				'SELECT "RecurringPayments"."id" FROM "RecurringPayments" ' +
				'WHERE ("RecurringPayments"."locationId" = $1 AND ' +
				"(" +
				'("RecurringPayments"."endDate" IS NULL AND "RecurringPayments"."startDate" = $2) ' +
				'OR ("RecurringPayments"."startDate", "RecurringPayments"."endDate") OVERLAPS ($3, $4))' +
				") " +
				"LIMIT $5 OFFSET $6) " +
				'as "exists"';

			assert.equal(result.sql, expected);
		});
	});

	describe(`Builder templates`, function () {
		interface FindAllCriteria {
			categories?: ReadonlyArray<number>;
			clients?: ReadonlyArray<number>;
			tags?: string;
			platforms?: ReadonlyArray<number>;
		}

		interface Page {
			limit?: number;
			offset?: number;
		}

		interface Params extends Page {
			criteria: FindAllCriteria;
		}

		const Upload = {
			id: QUploads.id,
		};

		const Tag = {
			id: QTags.id,

			title: QTags.title,
		};

		const BuilderTemplateCategory = {
			id: QBuilderTemplateCategories.id,

			groupLabel: QBuilderTemplateCategories.groupLabel,

			label: QBuilderTemplateCategories.label,

			width: QBuilderTemplateCategories.width,

			height: QBuilderTemplateCategories.height,

			platformId: QBuilderTemplateCategories.platformId,
		};

		const BuilderTemplate = {
			id: QBuilderTemplates.id,

			title: QBuilderTemplates.title,

			createdAt: QBuilderTemplates.createdAt,

			clientId: QBuilderTemplates.clientId,

			compositeImage: selectNestedMany(Upload),

			tags: selectNestedMany(Tag),

			categories: selectNestedMany(BuilderTemplateCategory),
		};

		function prepareDynamicQuery(params: Params) {
			// Let's assign some locals for brevity
			const QCategories = QBuilderTemplateCategories;
			const QCategoryMap = QBuilderTemplateToCategoryMap;

			let idSubQueryBuilder = subSelect<Params>(QBuilderTemplates.id)
				.orderBy(QBuilderTemplates.createdAt.desc())
				.limit(constant(10), constant(0));
			if (params.criteria.clients) {
				idSubQueryBuilder = idSubQueryBuilder.where(
					QBuilderTemplates.clientId.eqAny(() => params.criteria.clients || [])
				);
			} else if (params.criteria.platforms) {
				idSubQueryBuilder = idSubQueryBuilder.where(
					and(
						QBuilderTemplateCategories.platformId.eqAny(
							() => params.criteria.platforms || []
						),
						QBuilderTemplateToCategoryMap.builderTemplateId.eq(
							QBuilderTemplates.id
						),
						QBuilderTemplateToCategoryMap.builderTemplateCategoryId.eq(
							QBuilderTemplateCategories.id
						)
					)
				);
			}
			const idSubQuery = idSubQueryBuilder.toNode();

			return select(BuilderTemplate)
				.from(
					QBuilderTemplates.$table
						.innerJoin(QCategoryMap)
						.on(QCategoryMap.builderTemplateId.eq(QBuilderTemplates.id))
						.innerJoin(QCategories)
						.on(QCategories.id.eq(QCategoryMap.builderTemplateCategoryId))
						.innerJoin(QBuilderTemplateTags)
						.on(QBuilderTemplateTags.builderTemplateId.eq(QBuilderTemplates.id))
						.innerJoin(QTags)
						.on(QTags.id.eq(QBuilderTemplateTags.tagId))
						.innerJoin(QUploads)
						.on(QUploads.id.eq(QBuilderTemplates.compositeImageId))
				)
				.where(QBuilderTemplates.id.in(idSubQuery))
				.finalise({})
				.toSql(params);
		}

		it(`find all by client IDs`, function () {
			const result = prepareDynamicQuery({
				criteria: {
					clients: [1],
				},
				limit: 10,
				offset: 0,
			});
			assert.equal(
				result.sql,
				`SELECT "BuilderTemplates"."id" as "id", ` +
					`"BuilderTemplates"."title" as "title", ` +
					`"BuilderTemplates"."createdAt" as "createdAt", ` +
					`"BuilderTemplates"."clientId" as "clientId", ` +
					`"Uploads"."id" as "compositeImage.id", ` +
					`"Tags"."id" as "tags.id", ` +
					`"Tags"."title" as "tags.title", ` +
					`"BuilderTemplateCategories"."id" as "categories.id", ` +
					`"BuilderTemplateCategories"."groupLabel" as "categories.groupLabel", ` +
					`"BuilderTemplateCategories"."label" as "categories.label", ` +
					`"BuilderTemplateCategories"."width" as "categories.width", ` +
					`"BuilderTemplateCategories"."height" as "categories.height", ` +
					`"BuilderTemplateCategories"."platformId" as "categories.platformId" ` +
					`FROM "BuilderTemplates" ` +
					`INNER JOIN "BuilderTemplateToCategoryMap" ON "BuilderTemplateToCategoryMap"."builderTemplateId" = "BuilderTemplates"."id" ` +
					`INNER JOIN "BuilderTemplateCategories" ON "BuilderTemplateCategories"."id" = "BuilderTemplateToCategoryMap"."builderTemplateCategoryId" ` +
					`INNER JOIN "BuilderTemplateTags" ON "BuilderTemplateTags"."builderTemplateId" = "BuilderTemplates"."id" ` +
					`INNER JOIN "Tags" ON "Tags"."id" = "BuilderTemplateTags"."tagId" ` +
					`INNER JOIN "Uploads" ON "Uploads"."id" = "BuilderTemplates"."compositeImageId" ` +
					`WHERE "BuilderTemplates"."id" IN (SELECT "BuilderTemplates"."id" FROM "BuilderTemplates" WHERE "BuilderTemplates"."clientId" = ANY($1) ORDER BY "BuilderTemplates"."createdAt" DESC LIMIT $2 OFFSET $3)`
			);
			assert.deepEqual(result.parameters, [[1], 10, 0]);
		});

		it(`find all by platforms`, function () {
			const result = prepareDynamicQuery({
				criteria: {
					platforms: [123],
				},
				limit: 10,
				offset: 0,
			});
			assert.equal(
				result.sql,
				`SELECT "BuilderTemplates"."id" as "id", ` +
					`"BuilderTemplates"."title" as "title", ` +
					`"BuilderTemplates"."createdAt" as "createdAt", ` +
					`"BuilderTemplates"."clientId" as "clientId", ` +
					`"Uploads"."id" as "compositeImage.id", ` +
					`"Tags"."id" as "tags.id", ` +
					`"Tags"."title" as "tags.title", ` +
					`"BuilderTemplateCategories"."id" as "categories.id", ` +
					`"BuilderTemplateCategories"."groupLabel" as "categories.groupLabel", ` +
					`"BuilderTemplateCategories"."label" as "categories.label", ` +
					`"BuilderTemplateCategories"."width" as "categories.width", ` +
					`"BuilderTemplateCategories"."height" as "categories.height", ` +
					`"BuilderTemplateCategories"."platformId" as "categories.platformId" ` +
					`FROM "BuilderTemplates" ` +
					`INNER JOIN "BuilderTemplateToCategoryMap" ON "BuilderTemplateToCategoryMap"."builderTemplateId" = "BuilderTemplates"."id" ` +
					`INNER JOIN "BuilderTemplateCategories" ON "BuilderTemplateCategories"."id" = "BuilderTemplateToCategoryMap"."builderTemplateCategoryId" ` +
					`INNER JOIN "BuilderTemplateTags" ON "BuilderTemplateTags"."builderTemplateId" = "BuilderTemplates"."id" ` +
					`INNER JOIN "Tags" ON "Tags"."id" = "BuilderTemplateTags"."tagId" ` +
					`INNER JOIN "Uploads" ON "Uploads"."id" = "BuilderTemplates"."compositeImageId" ` +
					`WHERE "BuilderTemplates"."id" IN (` +
					`SELECT "BuilderTemplates"."id" ` +
					`FROM "BuilderTemplates", ` +
					`"BuilderTemplateCategories", ` +
					`"BuilderTemplateToCategoryMap" ` +
					`WHERE ("BuilderTemplateCategories"."platformId" = ANY($1) ` +
					`AND "BuilderTemplateToCategoryMap"."builderTemplateId" = "BuilderTemplates"."id" ` +
					`AND "BuilderTemplateToCategoryMap"."builderTemplateCategoryId" = "BuilderTemplateCategories"."id") ` +
					`ORDER BY "BuilderTemplates"."createdAt" DESC LIMIT $2 OFFSET $3` +
					`)`
			);
			assert.deepEqual(result.parameters, [[123], 10, 0]);
		});
	});

	describe(`Common Table Expressions (CTE)`, function () {
		/**
		 * WITH regional_sales AS (
		 *			SELECT region, SUM(amount) AS total_sales
		 *			FROM orders
		 *			GROUP BY region
		 *		 ), top_regions AS (
		 *			SELECT region
		 *			FROM regional_sales
		 *			WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
		 *		 )
		 *	SELECT region,
		 *		   product,
		 *		   SUM(quantity) AS product_units,
		 *		   SUM(amount) AS product_sales
		 *	FROM orders
		 *	WHERE region IN (SELECT region FROM top_regions)
		 *	GROUP BY region, product;
		 */
		it(`can query a CTE`, function () {
			const regionalSalesName = "regional_sales";
			const regionalSales = select({
				region: QOrders.region,
				total_sales: selectExpression(sum(QOrders.amount.col())),
			}).groupBy(QOrders.region);
			const regionalSalesMetamodel =
				regionalSales.toMetamodel(regionalSalesName);

			const topRegionsName = "top_regions";
			const topRegions = select({
				region: regionalSalesMetamodel.region,
			}).where(
				regionalSalesMetamodel.total_sales.gt(
					subSelect(
						divide(sum(regionalSalesMetamodel.total_sales.col()), literal("10"))
					).toNode()
				)
			);

			const query = select({
				region: QOrders.region,
				product: QOrders.product,
				product_units: selectExpression(sum(QOrders.quantity.col())),
				product_sales: selectExpression(sum(QOrders.amount.col())),
			})
				.with(
					withCte(regionalSalesName, regionalSales),
					withCte(topRegionsName, topRegions)
				)
				.where(
					QOrders.region.in(
						subSelect(topRegions.toMetamodel(topRegionsName).region).toNode()
					)
				)
				.groupBy(QOrders.region, QOrders.product);

			const result = query.finalise({}).toSql({});
			assert.equal(
				result.sql,
				`WITH "regional_sales" as (` +
					`SELECT "orders"."region" as "region", ` +
					`sum("orders"."amount") as "total_sales" ` +
					`FROM "orders" ` +
					`GROUP BY ("orders"."region")` +
					`), "top_regions" as (` +
					`SELECT "regional_sales"."region" as "region" ` +
					`FROM "regional_sales" ` +
					`WHERE "regional_sales"."total_sales" > (` +
					`SELECT sum("regional_sales"."total_sales") / 10 ` +
					`FROM "regional_sales")` +
					`) SELECT "orders"."region" as "region", "orders"."product" as "product", sum("orders"."quantity") as "product_units", sum("orders"."amount") as "product_sales" FROM "orders" WHERE "orders"."region" IN (SELECT "top_regions"."region" FROM "top_regions") GROUP BY ("orders"."region", "orders"."product")`
			);
		});

		/**
		 * WITH RECURSIVE t(n) AS (
		 * VALUES (1)
		 * UNION ALL
		 * SELECT n+1 FROM t WHERE n < 100
		 * )
		 * SELECT sum(n) FROM t;
		 */
		xit(`can query a recursive CTE`, function () {});
	});
});

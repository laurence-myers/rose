import { TableColumnsForUpdateCommand } from "../../src/query/metamodel";
import { QLocations, TUsers } from "../fixtures";
import { col, constant, param } from "../../src/query/dsl";
import { now } from "../../src/query/dsl/postgresql/dateTime/functions";
import { upper } from "../../src/query/dsl/postgresql/string/sql";

describe(`Metamodel`, () => {
	it(`can derive an interface from the metamodel`, async () => {
		const columns: TableColumnsForUpdateCommand<TUsers> = {
			deletedAt: now(),
			locationId: col(QLocations.id),
			name: upper(param((p: { name: string }) => p.name)),
			id: constant(1)
		};
	});
});

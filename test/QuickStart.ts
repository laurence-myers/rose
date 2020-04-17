// tag::first-import[]
import { params, select } from 'rose';
import { QStaff, StaffAllColumns, StaffRow } from '../generated/db/Staff';
// end::first-import[]
// tag::client-import[]
import { Client } from "pg";
import { dummyClient } from "./fixtures";
// end::client-import[]

describe(`Quick Start`, () => {
    it(`first example`, async () => {
        // tag::first[]

        interface Params {
            staffId: number;
        }
        const P = params<Params>();
        const query = select<typeof StaffAllColumns, Params>(StaffAllColumns)
            .where(
                QStaff.staffId.eq(P.staffId)
            ).prepare();
        // end::first[]

        const dummyStaffMember: StaffRow = {
            staffId: 1,
            active: true,
            addressId: 1,
            email: null,
            firstName: 'Franklin',
            lastName: 'Zimmerman',
            lastUpdate: new Date(),
            password: null,
            picture: null,
            storeId: 1,
            username: 'fzimmerman'
        };
        const client = dummyClient([
            dummyStaffMember
        ]);

        // tag::execute[]
        const rows = await query.execute(client, {
            staffId: 1
        });
        if (rows.length > 0) {
            const row = rows[0];
            console.log(`Retrieved staff member ${ row.firstName } ${ row.lastName }`);
        }
        // end::execute[]
    });

    xit(`Dummy connection`, async () => {
        // tag::client[]

        const client = new Client({
            connectionString: 'postgresql://postgres:password@localhost:5432/yourdb'
        });
        await client.connect();
        // end::client[]

        await client.end();
    });
});

// tag::first-import[]
import { select } from 'rose';
import { QStaff } from '../generated/db/Staff';
// end::first-import[]

describe(`Index`, () => {
    it(`first example`, async () => {
        // tag::first[]

        select({
            id: QStaff.staffId
        });
        // end::first[]
    });
});

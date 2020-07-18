import { CustomerAllColumns, CustomerRow, QCustomer } from "../generated/db/Customer";
import { ParamsWrapper, select, withParams } from "@rosepg/rose";
import { dummyClient } from "./fixtures";

describe(`Quick Start`, () => {
    const client = dummyClient([]);

    it(`examples`, async () => {
        // tag::example1[]
        const rows = await select(CustomerAllColumns) // <1>
            .finalise({}) // <2>
            .execute(client, {}); // <3>
        // end::example1[]

        // tag::example2[]
        await select({
            firstName: QCustomer.firstName,
            lastName: QCustomer.lastName
        })
            .finalise({})
            .execute(client, {});
        // end::example2[]

        // tag::example3[]
        await select({
            firstName: QCustomer.firstName,
            lastName: QCustomer.lastName
        })
            .from(QCustomer)
            .finalise({})
            .execute(client, {});
        // end::example3[]

        // tag::example4[]
        await withParams<{ customerIdToFind: CustomerRow['customerId'] }>()( // <1>
            (p) => // <2>
                select({
                    firstName: QCustomer.firstName,
                    lastName: QCustomer.lastName
                })
                    .where(QCustomer.customerId.eq(p.customerIdToFind)) // <3>
                    .finalise(p) // <4>
        ).execute(client, { customerIdToFind: 1234 }); // <5>
        // end::example4[]
    });

    xit(`orphan examples`, async () => {
        interface Params {
            customerId: CustomerRow['customerId'];
        }

        const params = new ParamsWrapper<Params>();

        await select({
            firstName: QCustomer.firstName,
            lastName: QCustomer.lastName
        })
            .where(QCustomer.customerId.eq(params.get(p => p.customerId)))
            .finalise(params)
            .execute(client, { customerId: 1234 });
    });
});

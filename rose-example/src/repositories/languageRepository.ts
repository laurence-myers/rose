import { Queryable, select, withParams } from "@rosepg/rose";
import { LanguageAllColumns, LanguageRow, QLanguage } from "../../generated/db/Language";

export class LanguageRepository {
    protected readonly getOneByNameQuery = (function () {
        interface Params {
            name: string;
        }

        return withParams<Params>()((p) => select(LanguageAllColumns)
            .where(QLanguage.name.eq(p.name))
            .finalise(p)
        );
    })();

    public async getOneByName(client: Queryable, name: string): Promise<LanguageRow | undefined> {
        return (await this.getOneByNameQuery.execute(client, {
            name
        }))[0];
    }
}

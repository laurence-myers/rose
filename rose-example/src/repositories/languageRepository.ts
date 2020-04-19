import { Queryable } from "rose/execution/execution";
import { LanguageAllColumns, LanguageRow, QLanguage } from "../../generated/db/Language";
import { ParamsWrapper, select } from "rose";

export class LanguageRepository {
    protected readonly getOneByNameQuery = (function () {
        interface Params {
            name: string;
        }

        const P = new ParamsWrapper<Params>();
        return select(LanguageAllColumns)
            .where(QLanguage.name.eq(P.get((p) => p.name)))
            .finalise(P);
    })();

    public async getOneByName(client: Queryable, name: string): Promise<LanguageRow | undefined> {
        return (await this.getOneByNameQuery.execute(client, {
            name
        }))[0];
    }
}

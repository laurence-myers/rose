import { Queryable, select, withParams } from "@rosepg/rose";
import {
  LanguageAllColumns,
  LanguageRow,
  QLanguage,
} from "../../generated/db/Language";

export class LanguageRepository {
  constructor(protected readonly client: Queryable) {}

  protected readonly getOneByNameQuery = (function () {
    interface Params {
      name: string;
    }

    return withParams<Params>()((p) =>
      select(LanguageAllColumns).where(QLanguage.name.eq(p.name)).finalise(p)
    );
  })();

  public async getOneByName(name: string): Promise<LanguageRow | undefined> {
    return (
      await this.getOneByNameQuery.execute(this.client, {
        name,
      })
    )[0];
  }
}

import {
  and,
  constant,
  initcap,
  innerJoin,
  insert,
  ParamsWrapper,
  Queryable,
  select,
  selectExpression,
  subSelect,
  TableColumnsForInsertCommand,
  upper,
} from "@rosepg/rose";
import {
  FilmDefaultQueries,
  FilmInsertRow,
  QFilm,
} from "../../generated/db/Film";
import { QActor } from "../../generated/db/Actor";
import { QFilmActor, TFilmActor } from "../../generated/db/FilmActor";

export class FilmRepository {
  constructor(protected readonly client: Queryable) {}

  private readonly selectLongestFilmsByActorNameQuery = (function () {
    const selector = {
      name: selectExpression(initcap(QFilm.title.col())),
      length: QFilm.length,
    };

    interface Params {
      firstName: string;
      lastName: string;
    }

    const P = new ParamsWrapper<Params>();

    return select(selector)
      .join(
        innerJoin(QFilmActor).on(QFilmActor.filmId.eq(QFilm.filmId)),
        innerJoin(QActor).on(QActor.actorId.eq(QFilmActor.actorId))
      )
      .where(
        and(
          QFilm.length.isNotNull(),
          QActor.firstName.eq(upper(P.get((p) => p.firstName))),
          QActor.lastName.eq(upper(P.get((p) => p.lastName)))
        )
      )
      .orderBy(QFilm.length.desc(), QFilm.title.asc())
      .finalise(P);
  })();

  public async selectLongestFilmsByActorName(
    firstName: string,
    lastName: string
  ): Promise<{ name: string; length: number }[]> {
    return (await this.selectLongestFilmsByActorNameQuery.execute(this.client, {
      firstName,
      lastName,
    })) as { name: string; length: number }[];
    // TODO: "length" is nullable, but we filter out nulls in our query. Is there a way we could avoid
    //  using a type assertion that "length" is "number" to assert that it's never null?
  }

  public insertOne(row: FilmInsertRow) {
    return FilmDefaultQueries.insertOne(row).execute(this.client, {});
  }

  private readonly addActorToFilmQuery = (function () {
    interface Params {
      filmName: string;
      actorName: {
        firstName: string;
        lastName: string;
      };
    }

    const P = new ParamsWrapper<Params>();

    return insert<TFilmActor, TableColumnsForInsertCommand<TFilmActor>>(
      QFilmActor
    )
      .insertFromQuery(
        subSelect(QFilm.filmId, QActor.actorId)
          .where(
            and(
              QFilm.title.eq(upper(P.get((p) => p.filmName))),
              QActor.firstName.eq(upper(P.get((p) => p.actorName.firstName))),
              QActor.lastName.eq(upper(P.get((p) => p.actorName.lastName)))
            )
          )
          .limit(constant(1))
          .toSubQuery()
      )
      .finalise(P);
  })();

  public async addActorToFilm(
    actorName: { firstName: string; lastName: string },
    filmName: string
  ): Promise<void> {
    return this.addActorToFilmQuery.execute(this.client, {
      actorName,
      filmName,
    });
  }
}

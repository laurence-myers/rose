import {
    and,
    col, constant,
    initcap,
    insert,
    ParamsWrapper,
    select,
    selectExpression,
    subSelect,
    TableColumnsForInsertCommand,
    upper
} from "@rose/rose";
import { FilmDefaultQueries, FilmInsertRow, QFilm } from "../../generated/db/Film";
import { QActor } from "../../generated/db/Actor";
import { QFilmActor, TFilmActor } from "../../generated/db/FilmActor";
import { Queryable } from "@rose/rose/execution/execution";

export class FilmRepository {
    private readonly selectLongestFilmsByActorNameQuery = (function () {
        const selector = {
            name: selectExpression(
                initcap(col(QFilm.title))
            ),
            length: QFilm.length,
        };

        interface Params {
            firstName: string;
            lastName: string;
        }
        const P = new ParamsWrapper<Params>();

        return select(selector)
            .join(QFilmActor).on(
                QFilmActor.filmId.eq(QFilm.filmId)
            )
            .join(QActor).on(
                QActor.actorId.eq(QFilmActor.actorId),
            )
            .where(
                and(
                    QFilm.length.isNotNull(),
                    QActor.firstName.eq(upper(P.get((p) => p.firstName))),
                    QActor.lastName.eq(upper(P.get((p) => p.lastName))),
                )
            )
            .orderBy(
                QFilm.length.desc(),
                QFilm.title.asc(),
            )
            .finalise(P);
    })();

    public async selectLongestFilmsByActorName(client: Queryable, firstName: string, lastName: string): Promise<{ name: string; length: number; }[]> {
        return (await this.selectLongestFilmsByActorNameQuery.execute(client, {
            firstName,
            lastName
        })) as { name: string; length: number; }[];
        // TODO: "length" is nullable, but we filter out nulls in our query. Is there a way we could avoid
        //  using a type assertion that "length" is "number" to assert that it's never null?
    }

    public insertOne(client: Queryable, row: FilmInsertRow) {
        return FilmDefaultQueries.insertOne(row).execute(client, {});
    }

    private readonly addActorToFilmQuery = (function () {
        interface Params {
            filmName: string;
            actorName: {
                firstName: string;
                lastName: string;
            }
        }

        const P = new ParamsWrapper<Params>();

        return insert<TFilmActor, TableColumnsForInsertCommand<TFilmActor>>(QFilmActor)
            .insertFromQuery(
                subSelect(
                    QFilm.filmId,
                    QActor.actorId
                ).where(
                    and(
                        QFilm.title.eq(upper(P.get((p) => p.filmName))),
                        QActor.firstName.eq(upper(P.get((p) => p.actorName.firstName))),
                        QActor.lastName.eq(upper(P.get((p) => p.actorName.lastName)))
                    )
                ).limit(constant(1))
                    .toSubQuery()
            ).finalise(P)
    })();

    public async addActorToFilm(client: Queryable, actorName: { firstName: string; lastName: string; }, filmName: string): Promise<void> {
        return this.addActorToFilmQuery.execute(client, {
            actorName,
            filmName
        });
    }
}

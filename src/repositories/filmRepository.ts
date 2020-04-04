import { and, ParamsWrapper, select, upper } from "rose";
import { QFilm } from "../../generated/db/Film";
import { QActor } from "../../generated/db/Actor";
import { QFilmActor } from "../../generated/db/FilmActor";
import { Queryable } from "rose/execution/execution";

export class FilmRepository {
    private readonly selectLongestFilmsByActorNameQuery = (function () {
        const selector = {
            name: QFilm.title,
            length: QFilm.length,
        };

        interface Params {
            firstName: string;
            lastName: string;
        }
        const P = new ParamsWrapper<Params>();

        return select<typeof selector, Params>(selector)
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
            .prepare();
    })();

    public async selectLongestFilmsByActorName(client: Queryable, firstName: string, lastName: string): Promise<{ name: string; length: number; }[]> {
        return (await this.selectLongestFilmsByActorNameQuery.execute(client, {
            firstName,
            lastName
        })) as { name: string; length: number; }[];
        // TODO: "length" is nullable, but we filter out nulls in our query. Is there a way we could avoid
        //  using a type assertion that "length" is "number" to assert that it's never null?
    }
}

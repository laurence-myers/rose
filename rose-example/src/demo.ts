import { Client } from "pg";
import { FilmRepository } from "./repositories/filmRepository";
import { LanguageRepository } from "./repositories/languageRepository";
import { transaction } from "rose";

const dbUrl = `postgresql://root:admin@localhost:5442/pagila`;

const filmRepository = new FilmRepository();
const languageRepository = new LanguageRepository();

function createClient(): Client {
    return new Client({
        connectionString: dbUrl
    });
}

async function insertNewFilm(client: Client) {
    console.log(`Insert the new film "Duck Hunted", starring Joe Swank`);
    const language = await languageRepository.getOneByName(client, 'English');
    if (!language) {
        throw new Error(`The English language must exist!`);
    }
    await transaction(client, async () => {
        await filmRepository.insertOne(client, {
            description: `An intrepid shooty bang bang man Giggles McVuvuzela enters a once-familiar marsh, but unexpected perils quack in the shadows.`,
            fulltext: ``, // This is a tsvector. It's not nullable, but we don't need to populate it ourselves.
            languageId: language.languageId,
            length: 120,
            title: "DUCK HUNTED"
        });
        await filmRepository.addActorToFilm(client, {
            firstName: 'Joe',
            lastName: 'Swank'
        }, 'Duck Hunted');
    });
}

async function selectJoeSwankFilms(client: Client) {
    console.log("Select films starring Joe Swank, ordered by longest running time:");
    const films = await filmRepository.selectLongestFilmsByActorName(client, 'joe', 'swank');
    console.log(
        films
            .map((film) => `${ film.name } (${ film.length })`)
            .join(', ')
    );
}

async function executeDemoQueries(client: Client) {
    await insertNewFilm(client);
    await selectJoeSwankFilms(client);
}

export async function demo(): Promise<void> {
    let client: Client | undefined;
    async function cleanup() {
        if (client) {
            try {
                await client.end();
            } catch (err) {
                console.error(`Could not close DB connection: ${ err }`);
            }
        }
    }
    try {
        client = createClient();
        await client.connect();
        await executeDemoQueries(client);
    } finally {
        await cleanup();
    }
}

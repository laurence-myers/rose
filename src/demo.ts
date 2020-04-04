import { Client } from "pg";
import { FilmRepository } from "./repositories/filmRepository";

const dbUrl = `postgresql://root:admin@localhost:5442/pagila`;

const filmRepository = new FilmRepository();

function createClient(): Client {
    return new Client({
        connectionString: dbUrl
    });
}

async function executeDemoQueries(client: Client) {
    console.log("Films starring Joe Swank, ordered by longest running time:");
    const films = await filmRepository.selectLongestFilmsByActorName(client, 'joe', 'swank');
    console.log(
        films
            .map((film) => `${ film.name } (${ film.length })`)
            .join(', ')
    );
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

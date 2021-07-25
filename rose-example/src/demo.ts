import { ConnectionManager, DatabaseContext } from "./database";
import { dbUrl } from "./config";

async function insertNewFilm(db: DatabaseContext) {
  console.log(`Insert the new film "Duck Hunted", starring Joe Swank`);
  const language = await db.languageRepository.getOneByName("English");
  if (!language) {
    throw new Error(`The English language must exist!`);
  }
  await db.inTransaction(async () => {
    await db.filmRepository.insertOne({
      description: `An intrepid shooty bang bang man Giggles McVuvuzela enters a once-familiar marsh, but unexpected perils quack in the shadows.`,
      fulltext: ``, // This is a tsvector. It's not nullable, but we don't need to populate it ourselves.
      languageId: language.languageId,
      length: 120,
      title: "DUCK HUNTED",
    });
    await db.filmRepository.addActorToFilm(
      {
        firstName: "Joe",
        lastName: "Swank",
      },
      "Duck Hunted"
    );
  });
}

async function selectJoeSwankFilms(db: DatabaseContext) {
  console.log(
    "Select films starring Joe Swank, ordered by longest running time:"
  );
  const films = await db.filmRepository.selectLongestFilmsByActorName(
    "joe",
    "swank"
  );
  console.log(films.map((film) => `${film.name} (${film.length})`).join(", "));
}

async function executeDemoQueries(db: DatabaseContext) {
  await insertNewFilm(db);
  await selectJoeSwankFilms(db);
}

export async function demo(): Promise<void> {
  let connectionManager;
  try {
    connectionManager = new ConnectionManager(dbUrl);
    await connectionManager.withConnection(async (db) => {
      await executeDemoQueries(db);
    });
  } finally {
    if (connectionManager) {
      try {
        await connectionManager.dispose();
      } catch (err) {
        console.error(`Could not close DB pool: ${err}`);
      }
    }
  }
}

import { demo } from "./demo";

enum ExitCode {
  Okay,
  UnhandledError,
}

async function main(_args: string[]): Promise<ExitCode> {
  let exitCode = ExitCode.Okay;
  await demo();
  return exitCode;
}

if (require.main === module) {
  //noinspection JSIgnoredPromiseFromCall
  main(process.argv.slice(2))
    .then((exitCode) => (process.exitCode = exitCode))
    .catch((err) => {
      console.error(`Unhandled error`);
      console.error(err);
      process.exitCode = ExitCode.UnhandledError;
    });
}

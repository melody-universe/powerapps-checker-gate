import { Log } from "sarif";
import merge from "merge";
import { Command } from "commander";
import { readFile } from "fs/promises";
import { exit } from "process";

new Command()
  .argument("<logsFile>", "path to the SARIf logs file")
  .option("-i, --info <Informational>", "informational threshold", parseInt)
  .option("-l, --low <Low>", "low threshold", parseInt, 0)
  .option("-m, --medium <Medium>", "medium threshold", parseInt, 0)
  .option("-h, --high <High>", "high threshold", parseInt, 0)
  .option("-c, --critical <Critical>", "critical threshold", parseInt, 0)
  .action(async (logsFile: string, options: Levels) => {
    const contents = (await readFile(logsFile)).toString();
    const sarif = [JSON.parse(contents) as Log | Log[]].flat();
    const severityLevels = sarif.reduce<Levels>(
      (rootLevels, log) =>
        log.runs.reduce<Levels>((runLevels, run) => {
          if (run.results) {
            return run.results.reduce((resultLevels, result) => {
              if (result.properties) {
                const severity =
                  result.properties.severity.toLowerCase() as Severity;
                const currentSeverityCount = resultLevels[severity] || 0;
                return merge(true, resultLevels, {
                  [severity]: currentSeverityCount + 1,
                });
              } else {
                return resultLevels;
              }
            }, runLevels);
          } else {
            return runLevels;
          }
        }, rootLevels),
      {}
    );
    const errorMessages: string[] = [];
    for (const severity of Object.keys(options) as Severity[]) {
      if (
        options[severity] !== undefined &&
        severityLevels[severity] !== undefined &&
        (severityLevels[severity] as number) > (options[severity] as number)
      ) {
        errorMessages.push(
          `Passed threshold for severity "${toTitleCase(severity)}." ` +
            `Issues found: ${severityLevels[severity]}. ` +
            `Max threshold: ${options[severity]}`
        );
      }
    }
    if (errorMessages.length > 0) {
      errorMessages.forEach((message) => console.error(message));
      exit(1);
    }
  })
  .parse();

type Severity = keyof Levels;

interface Levels {
  informational?: number;
  low?: number;
  medium?: number;
  high?: number;
  critical?: number;
}

function toTitleCase(value: string) {
  if (value.length === 0) {
    return value;
  } else {
    return `${value[0].toUpperCase()}${value.substring(1)}`;
  }
}

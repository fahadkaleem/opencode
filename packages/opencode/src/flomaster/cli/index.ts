/**
 * FloMaster CLI Entry Point
 *
 * Standalone CLI for workflow orchestration.
 * Uses opencode's infrastructure but provides its own command structure.
 */

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Log } from "@/util/log"
import { WorkflowCommand } from "./workflow"

process.on("unhandledRejection", (e) => {
  Log.Default.error("rejection", {
    e: e instanceof Error ? e.message : e,
  })
})

process.on("uncaughtException", (e) => {
  Log.Default.error("exception", {
    e: e instanceof Error ? e.message : e,
  })
})

const cli = yargs(hideBin(process.argv))
  .parserConfiguration({ "populate--": true })
  .scriptName("flomaster")
  .wrap(100)
  .help("help", "show help")
  .alias("help", "h")
  .version("version", "show version number", "0.1.0")
  .alias("version", "v")
  .command(WorkflowCommand)
  .demandCommand(1, "You need to specify a command")
  .strict()

await cli.parse()

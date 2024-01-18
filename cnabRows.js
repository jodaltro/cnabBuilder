"use strict";
import { readFile } from "fs/promises";
import { createReadStream } from "fs";

import { createInterface } from "readline";

import yargs from "yargs";
import chalk from "chalk";
import { getFullPath } from "./cnabUtils.js";

const optionsYargs = yargs(process.argv.slice(2))
  .usage("Uso: $0 [options]")
  .option("f", {
    alias: "from",
    describe: "posição inicial de pesquisa da linha do Cnab",
    type: "number",
    demandOption: true,
  })
  .option("t", {
    alias: "to",
    describe: "posição final de pesquisa da linha do Cnab",
    type: "number",
    demandOption: true,
  })
  .option("s", {
    alias: "segmento",
    describe: "tipo de segmento",
    type: "string",
    demandOption: true,
  })
  .option("p", {
    alias: "path",
    describe: "caminho do arquivo Cnab",
    type: "string",
  })
  .option("fs", {
    alias: "fullSegmento",
    describe: "segmento específicos",
    type: "string",
  })
  .example(
    "$0 -f 21 -t 34 -s p",
    "lista a linha e campo que from e to do cnab"
  ).argv;

const { from, to, segmento, fullSegmento } = optionsYargs;

const file = getFullPath(optionsYargs.path);

console.log("Caminho do Arquivo CNAB: ", file);

const messageLog = (segmento, segmentoType, from, to) => `
----- Cnab linha ${segmentoType} -----

posição from: ${chalk.inverse.bgBlack(from)}

posição to: ${chalk.inverse.bgBlack(to)}

item isolado: ${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}

item dentro da linha P: 
  ${segmento.substring(0, from)}${chalk.inverse.bgBlack(
  segmento.substring(from - 1, to)
)}${segmento.substring(to)}

----- FIM ------
`;

const log = console.log;

console.time("leitura Async");

const fileStream = createInterface({
  input: createReadStream(file),
  output: process.stdout,
  terminal: false,
});

let lineIndex = 1;
let isFound = false;

fileStream.on("line", (line) => {
  try {
    isFound = findOnLine(line, lineIndex, segmento, from, to);
  } catch (error) {
    console.log("🚀 ~ file: cnabRows.js ~ line 76 ~ error", error);
  }

  if (isFound) {
    log(messageLog(line, segmento, from, to));

    fileStream.close();
    fileStream.removeAllListeners();
    return;
  }

  lineIndex++;
});

fileStream.on("close", () => {
  console.timeEnd("leitura Async");
});

function findOnLine(line, lineIndex, segmento) {

  return checkBySegmento(lineIndex, segmento);

}

function checkBySegmento(lineIndex, segmento) {
  if (lineIndex == 3 && segmento === "p") {
    return true
  }

  if (lineIndex == 4 && segmento === "q") {
    return true
  }

  if (lineIndex == 5 && segmento === "r") {
    return true
  }


  return false
}


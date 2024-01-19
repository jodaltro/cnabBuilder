"use strict";
import { readFile, writeFile } from "fs/promises";
import { createReadStream } from "fs";

import { createInterface } from "readline";

import yargs from "yargs";
import chalk from "chalk";
import { getFullPath } from "./cnabUtils.js";

const febran240 = {
  q: {
    pagador: {
      nome: {
        from: 34,
        to: 73,
      },
      endereco: {
        from: 74,
        to: 113,
      },
      bairro: {
        from: 114,
        to: 128,
      },
      cep: {
        from: 129,
        to: 136,
      },
      cidade: {
        from: 137,
        to: 151,
      },
      uf: {
        from: 152,
        to: 153,
      },
    },
  },
};

const optionsYargs = getYargs();

const { from, to, segmento, segmentoEspecifico, empresaNome, exportaJson } =
  optionsYargs;

const file = getFullPath(optionsYargs.path);

console.log("Caminho do Arquivo CNAB: ", file);

const log = console.log;

console.time("leitura Async");

const fileStream = createInterface({
  input: createReadStream(file),
  output: process.stdout,
  terminal: false,
});

let lineIndex = 1;
let isFinishSearch = false;

fileStream.on("line", (line) => {
  try {
    isFinishSearch = findOnLine(
      line,
      lineIndex,
      segmento,
      segmentoEspecifico,
      empresaNome
    );
  } catch (error) {
    console.log("FileError: ", error);
  }

  if (isFinishSearch === true) {
    const lineSegmento = line.charAt(13);
    log(messageLog(line, lineSegmento, from, to, empresaNome));

    if (exportaJson) {
      expotAsJson(line, lineSegmento, lineIndex, file);
    }
  }

  if (isFinishSearch) {
    fileStream.close();
    fileStream.removeAllListeners();
    return;
  }
  lineIndex++;
});

fileStream.on("close", () => {
  console.timeEnd("leitura Async");
});

function getYargs() {
  return yargs(process.argv.slice(2))
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
    .option("e", {
      alias: "segmentoEspecifico",
      describe: "busca por segmento específicos",
      type: "string",
    })
    .option("n", {
      alias: "empresaNome",
      describe: "busca por nome da empresa",
      type: "string",
    })
    .option("x", {
      alias: "exportaJson",
      describe: "exportar o resultado em json",
      default: false,
      type: "boolean",
    })
    .example(
      "$0 -f 21 -t 34 -s p",
      "lista a linha e campo que from e to do cnab"
    ).argv;
}

function findOnLine(
  line,
  lineIndex,
  segmento,
  segmentoEspecifico,
  empresaNome
) {
  if (segmentoEspecifico) {
    const isLineOfSegmento = findBySegmentoEspecifico(line, segmentoEspecifico);

    if (isLineOfSegmento && empresaNome) {
      return findByEmpresaNome(line, empresaNome);
    }

    return isLineOfSegmento;
  }

  if (empresaNome) {
    return findByEmpresaNome(line, empresaNome);
  }

  return checkBySegmento(lineIndex, segmento);
}

function findByEmpresaNome(line, empresaNome) {
  if (line.indexOf(empresaNome) != -1) {
    return true;
  }
}

function findBySegmentoEspecifico(line, segmentoEspecifico) {
  if (line.startsWith(segmentoEspecifico)) {
    return true;
  }
}

function checkBySegmento(lineIndex, segmento) {
  if (lineIndex == 3 && segmento === "p") {
    return true;
  }

  if (lineIndex == 4 && segmento === "q") {
    return true;
  }

  if (lineIndex == 5 && segmento === "r") {
    return true;
  }
}

async function expotAsJson(line, lineSegmento, lineIndex, fileName) {
  const { endereco, bairro, cep, cidade, uf } = febran240.q.pagador;
  const json = {
    segmento: line.substring(0, 14),
    possicaoLinha: lineIndex,
  };
  if (lineSegmento == "Q") {
    json.empresa = {
      nome: getEmpresaNome(line),
      endereco: line.substring(endereco.from - 1, endereco.to).trim(),
      bairro: line.substring(bairro.from - 1, bairro.to).trim(),
      cep: line.substring(cep.from - 1, cep.to).trim(),
      cidade: line.substring(cidade.from - 1, cidade.to).trim(),
      uf: line.substring(uf.from - 1, uf.to).trim(),
    };
  }

  await writeFile(`${fileName}.json`, JSON.stringify(json), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

const getEmpresaNome = (line) =>
  `${line.substring(
    febran240.q.pagador.nome.from - 1,
    febran240.q.pagador.nome.to
  )}`.trim();

const getEmpresaNomePossition = (line, empresaNome) =>
  line.indexOf(empresaNome) + 1;

function messageLog(line, segmentoType, from, to, empresaNome) {
  let empresa = `segnmento ${segmentoType} não possui imformação de empresa associada!`;

  if (segmentoType === "Q") {
    const { nome } = febran240.q.pagador;
    empresa = `empresa associada: ${chalk.inverse.bgBlack(
      getEmpresaNome(line)
    )}`;

    if (empresaNome) {
      empresa += `  encontrada utilizando "${empresaNome}" na posição: ${chalk.inverse.bgBlack(
        getEmpresaNomePossition(line, empresaNome)
      )}`;
    }
  }

  return `
  ----- Cnab linha ${segmentoType} -----
  
  posição from: ${chalk.inverse.bgBlack(from)}
  
  posição to: ${chalk.inverse.bgBlack(to)}
  
  item isolado: ${chalk.inverse.bgBlack(line.substring(from - 1, to))}

  ${empresa}

  item dentro da linha ${segmentoType}: 
  ${line.substring(0, from)}${chalk.inverse.bgBlack(
    line.substring(from - 1, to)
  )}${line.substring(to)}
    
    ----- FIM ------
    `;
}

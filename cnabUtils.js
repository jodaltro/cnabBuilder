import { fileURLToPath } from 'url';
import path from 'path'

const getFullPath = (filePath) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (!filePath) {
        console.log("Caminho do arquivo CNAB não informado, sera utilizado o arquivo padrão!");
        return path.resolve(`${__dirname}/cnabExample.rem`);
    }


    return path.resolve(`${__dirname}/${filePath}`);
}


export { getFullPath }
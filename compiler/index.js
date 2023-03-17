import * as fs from "fs/promises";
import path from "path";
import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import { transformFromAst } from "@babel/core";

const traverse = _traverse.default;

const normalizePath = (str) =>
  str.replaceAll(/\\\\|\\|\|\/\/|\/\/\/\/|\/\/|\/|\./g, "");

const generateCode = (ast) => {
  const { code } = transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return `() => { const exports = {}; ;${code}; return exports}`;
};

const createAssets = async (entryPath) => {
  const paths = [entryPath];

  const assets = {};

  while (paths.length) {
    let currentPath = paths.shift();
    // TODO добавить проверка на тип файлоы в директории,
    // создать кеш с файлами по директориям и смотреть
    // что там есть подходящее если нет расширения у импорта
    const fileContent = await fs.readFile(currentPath, "utf-8");

    const ast = parser.parse(fileContent, { sourceType: "module" });

    const currentDir = path.dirname(currentPath);

    traverse(ast, {
      ImportDeclaration: function (node) {
        const absolutePath = path.join(currentDir, node.node.source.value);
        node.node.source.value = normalizePath(absolutePath);
        // TODO проверка на isDir(path) ? path + index.js : path
        paths.push(absolutePath);
      },
    });

    const code = generateCode(ast, fileContent);
    assets[normalizePath(currentPath)] = code;
  }

  return assets;
};

const entryPath = "./src/index.js";

const build = async (entryPath) => {
  const assets = await createAssets(entryPath);

  const formattedAssets =
    "{" +
    Object.entries(assets).reduce(
      (acc, [key, code]) => acc + `'${key}': ${code},`,
      ""
    ) +
    "}";

  const modules = "const modules = " + formattedAssets;

  const bundle = `((entryPath) => {
    ${modules}

    const cached_modules = {};

    const require = (path) => {
      const cached = cached_modules[path];
      if (cached) {
        return cached;
      } else {
        const moduleResult = modules[path]();
        cached_modules[path] = moduleResult;

        return moduleResult;
      };

      
    };
    
    require(entryPath)

})("${normalizePath(entryPath)}")`;

  await fs.writeFile("dist/index.js", bundle);
};

build(entryPath);

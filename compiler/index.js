import * as fs from "fs/promises";
import path from "path";
import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import md5 from "blueimp-md5";
import { transformFromAst } from "@babel/core";
import { addStylesToHtml } from "./addStyles.js";
import { addScriptToHtml } from "./addScripts.js";

const traverse = _traverse.default;

const normalizePath = (str) =>
  str.replaceAll(/\\\\|\\|\|\/\/|\/\/\/\/|\/\/|\/|\./g, "");

const generateCode = (ast) => {
  const { code } = transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return `() => { const exports = {}; ;${code}; return exports}`;
};

const createStylesFolder = async (pathToStyles) => {
  const folder = await fs.readdir(path.join("dist"));

  if (
    folder.includes("styles") &&
    !(await fs.stat(pathToStyles)).isDirectory()
  ) {
    await fs.rm(pathToStyles);
    await fs.mkdir(pathToStyles);
  } else if (!folder.includes("styles")) {
    await fs.mkdir(pathToStyles);
  }
};

const createStyleAsset = async (filePath) => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const newFileName = md5(fileContent) + ".css";
  const pathToStyles = path.join("dist", "styles");

  await createStylesFolder(pathToStyles);

  const pathToFile = path.join(pathToStyles, newFileName);

  fs.writeFile(pathToFile, fileContent, "utf-8");

  return newFileName;
};

const createAssets = async (entryPath) => {
  const paths = [entryPath];

  let stylesPaths = [];
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
        if (absolutePath.endsWith(".css")) {
          node.remove();
          const styleAsset = createStyleAsset(absolutePath);
          stylesPaths.push(styleAsset);
        } else {
          node.node.source.value = normalizePath(absolutePath);
          // TODO проверка на isDir(path) ? path + index.js : path
          paths.push(absolutePath);
        }
      },
    });

    const code = generateCode(ast, fileContent);
    assets[normalizePath(currentPath)] = code;
  }
  stylesPaths = await Promise.all(stylesPaths);

  return { assets, stylesPaths };
};

const build = async (entryPath) => {
  const { assets, stylesPaths } = await createAssets(entryPath);

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

  let indexFileContent = await fs.readFile("index.html", "utf-8");
  indexFileContent = addStylesToHtml(indexFileContent, stylesPaths);
  indexFileContent = addScriptToHtml(indexFileContent);

  await writeHtmlFile(indexFileContent, path.join("dist", "index.html"));
};

const writeHtmlFile = async (content, filePath) => {
  await fs.writeFile(filePath, content, "utf-8");
};

const createDist = async () => {
  try {
    await fs.readdir("dist");
  } catch (error) {
    await fs.mkdir("dist");
  }
};

const clearDist = async (distPath) => {
  const files = await fs.readdir(distPath);

  for (let i = 0; i < files.length; i++) {
    const element = files[i];
    await fs.rm(path.join("dist", element), { recursive: true, force: true });
  }
};

const run = async (options) => {
  const { entryPath = "" } = { ...options };

  await createDist();

  await clearDist("dist");

  await build(entryPath);
};

run({ entryPath: "./src/index.js" });

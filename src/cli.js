#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { lintProject } from "./boundary.js";
const configFile = process.argv[2];
const options = configFile ? JSON.parse(await readFile(configFile, "utf8")) : {};
const errors = (await lintProject(path.resolve(options.root ?? "."), options)).filter((error) =>
  error.file.endsWith(".html"),
);
for (const error of errors)
  console.error(`${error.file}:${error.line}:${error.column} ${error.rule}: ${error.message}`);
process.exitCode = errors.length ? 1 : 0;

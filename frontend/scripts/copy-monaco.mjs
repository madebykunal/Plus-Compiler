import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const source = new URL("../node_modules/monaco-editor/", import.meta.url);
const target = new URL("../public/monaco/", import.meta.url);
const stamp = new URL("version", target);
const { version } = JSON.parse(readFileSync(new URL("package.json", source), "utf8"));

if (existsSync(stamp) && readFileSync(stamp, "utf8") === version) process.exit(0);

rmSync(target, { recursive: true, force: true });
cpSync(new URL("min/vs/", source), new URL("vs/", target), { recursive: true });
writeFileSync(stamp, version);
console.log(`copied monaco-editor ${version} to public/monaco`);

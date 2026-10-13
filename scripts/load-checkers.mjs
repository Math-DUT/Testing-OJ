import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
export async function loadCheckers() {
  const regionals=(await fs.readFile('src/regionalCheckers.ts','utf8')).replace('export function regionalCheck','function regionalCheck');
  const main=(await fs.readFile('src/checkers.ts','utf8')).replace(/^import .*regionalCheckers.*;\r?\n/m,'').replace('export function checkOutput','function checkOutput');
  const context=vm.createContext({});
  vm.runInContext(ts.transpile(regionals+'\n'+main,{target:ts.ScriptTarget.ES2022}),context);
  return context;
}

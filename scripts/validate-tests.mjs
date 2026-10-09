/* Validate every generated construction with independent browser checkers. */
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const code = await fs.readFile("src/checkers.ts", "utf8");
const js = ts.transpile(
  code.replace("export function checkOutput", "function checkOutput"),
  { target: ts.ScriptTarget.ES2022 },
);
const context = vm.createContext({});
vm.runInContext(js, context);
const interactive = vm.createContext({});
vm.runInContext(
  await fs.readFile("public/runtime/hidden-track.js", "utf8"),
  interactive,
);
let count = 0,
  tricky = 0;
for (const [cid, path] of [
  ["lncpc-2025", "src/problems.json"],
  ["icpc-online-2026-1", "src/data/icpc-online-2026-1.json"],
  ["icpc-online-2026-2", "src/data/icpc-online-2026-2.json"],
]) {
  const problems = JSON.parse(await fs.readFile(path, "utf8"));
  for (const p of problems) {
    assert(p.markdown.length > 150 && p.statementFormat !== "pdf", `${cid}/${p.id}: missing native statement`);
    assert.equal(p.tests.length, 15);
    assert.equal(p.tests.filter((t) => t.kind === "trick").length, 3);
    assert.equal(new Set(p.tests.map((t) => t.file || t.input)).size, 15);
    for (const [i, test] of p.tests.entries()) {
      if (test.file) {
        const bytes = await fs.readFile("public/" + test.file);
        assert.equal(createHash("sha256").update(bytes).digest("hex"), test.sha256);
        const data = JSON.parse(gunzipSync(bytes));
        assert.equal(Buffer.byteLength(data.input), test.inputBytes);
        assert.equal(Buffer.byteLength(data.output), test.outputBytes);
        Object.assign(test, data);
      }
      if (p.checker === "hidden-track") {
        const judge = new interactive.HiddenTrackJudge(test.input);
        for (const line of test.output.split("\n").filter(Boolean))
          judge.write(line + "\n");
        assert.equal(judge.finish().status, "PASS");
      } else
        assert(
          context.checkOutput(p.checker, test.input, test.output, test.output),
          `${cid}/${p.id}/${i + 1}: reference construction invalid`,
        );
      count++;
      tricky += test.kind === "trick";
    }
  }
}
// These are deliberately different valid constructions, not the stored answer.
assert(context.checkOutput("recall", "1\n2\n+ 1\nF 1\n", "+-?", "+-?-"));
assert(!context.checkOutput("recall", "1\n2\n+ 1\nF 1\n", "+?", "+-?"));
assert(context.checkOutput("lcm-permutation", "1\n3\n", "3 2 1", "1 2 3"));
assert(!context.checkOutput("lcm-permutation", "1\n3\n", "1 1 2", "1 2 3"));
assert(context.checkOutput("wolf-game", "1\n2\nLR\n0 0\n", "1 0", "00"));
assert(!context.checkOutput("wolf-game", "1\n2\nLR\n0 0\n", "11", "00"));
assert(context.checkOutput("xor-closed", "1 2\n1 1\n", "1 0", "1 0"));
assert(!context.checkOutput("xor-closed", "1 2\n1 1\n", "1 2", "1 0"));
assert(context.checkOutput("float-1e-9", "", "1.0000000001", "1"));
assert(!context.checkOutput("float-1e-9", "", "NaN", "1"));
assert(!context.checkOutput("float-1e-9", "", "1.00000001", "1"));
// Check real query replies, per-case reset, out-of-range queries and query cap.
let judge = new interactive.HiddenTrackJudge("2\n3\n1 0 2\n1\n0\n");
assert.equal(judge.write("? 1 -1\n? 1 0\n? 1 1\n? 1 2\n"), "1\n1\n0\n2\n");
assert.equal(judge.write("! 1 0 2\n"), "1\n");
judge.write("! 0\n");
assert.equal(judge.finish().status, "PASS");
judge = new interactive.HiddenTrackJudge("1\n3\n1 0 2\n");
judge.write("? 4 0\n");
assert.equal(judge.finish().status, "WA");
judge = new interactive.HiddenTrackJudge("1\n2\n0 1\n");
judge.write("? 0 -1\n".repeat(3));
assert.equal(judge.finish().status, "WA");
// Verify the accelerated bit-spectrum replies independently at full size.
let seed = 20261009;
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
const parity = value => {
  let answer = 0;
  while (value) { answer ^= value & 1; value >>>= 1; }
  return answer;
};
for (const n of [31, 64, 129, 511, 1000]) {
  const path = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i; i--) {
    const j = next() % (i + 1);
    [path[i], path[j]] = [path[j], path[i]];
  }
  if (path[0] > path[n - 1]) path.reverse();
  const judge = new interactive.HiddenTrackJudge(`1\n${n}\n${path.join(" ")}\n`);
  const k = Math.ceil(Math.log2(n));
  for (let q = 0; q < Math.min(200, n * k); q++) {
    const mask = next() % (2 ** k), vertex = next() % (n + 1) - 1;
    const selected = path.map(x => parity(x & mask) ^ Number(x === vertex));
    const expected = selected.slice(1).filter((x, i) => x !== selected[i]).length % 3;
    assert.equal(judge.write(`? ${mask} ${vertex}\n`), `${expected}\n`);
  }
  judge.write(`! ${path.join(" ")}\n`);
  assert.equal(judge.finish().status, "PASS");
}
console.log(
  `${count} test files, ${tricky} trick files; all construction validators and interactor checks passed.`,
);

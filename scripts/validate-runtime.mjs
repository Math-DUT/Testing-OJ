import fs from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import assert from "node:assert/strict";
const root = "public/runtime/cpp22";
const receipts = JSON.parse(
  fs.readFileSync(`${root}/asset-receipts.json`, "utf8"),
);
for (const [name, expected] of Object.entries(receipts)) {
  const bytes = fs.readFileSync(`${root}/${name}`);
  assert.equal(bytes.length, expected.bytes, name);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    expected.sha256,
    name,
  );
  if (name.endsWith(".wasm.gz"))
    assert.deepEqual(
      gunzipSync(bytes).subarray(0, 4),
      Buffer.from([0, 97, 115, 109]),
      name,
    );
}
assert.equal(
  JSON.parse(fs.readFileSync(`${root}/runtime-manifest.v1.json`, "utf8"))
    .compiler.sysroot.printscanLongDouble.asset,
  "bin/printscan-long-double.a",
);
console.log(
  "7 pinned runtime assets verified; Clang 22 + full long double stdio",
);
const pythonRoot = "public/runtime/pyodide";
const pythonManifest = JSON.parse(fs.readFileSync(`${pythonRoot}/runtime-manifest.json`, "utf8"));
assert.equal(pythonManifest.version, "0.27.7");
for (const asset of pythonManifest.assets) {
  const bytes = fs.readFileSync(`${pythonRoot}/${asset.file}`);
  assert.equal(bytes.length, asset.bytes, asset.file);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.file);
}
console.log("5 pinned Pyodide assets verified; same-origin Python runtime");

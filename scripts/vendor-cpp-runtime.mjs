// Reproducible JS host and package assets; the optional libc archive is pinned separately.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root = "public/runtime/cpp22";
const packageRoot = "node_modules/@live-codes/clang-wasm";
const originalManifest = fs.readFileSync(
  `${root}/runtime-manifest.v1.json`,
  "utf8",
).replace(/\r\n/g, "\n");
for (const name of [
  "bin/clang.wasm.gz",
  "bin/lld.wasm.gz",
  "bin/memfs.wasm.gz",
  "bin/sysroot.tar.gz",
]) {
  fs.mkdirSync(path.dirname(`${root}/${name}`), { recursive: true });
  fs.copyFileSync(`${packageRoot}/assets/${name}`, `${root}/${name}`);
}
await build({
  entryPoints: [`${packageRoot}/src/toolchain.js`],
  outfile: `${root}/toolchain.js`,
  bundle: true,
  format: "iife",
  globalName: "clangWasmToolchain",
  minify: true,
  platform: "browser",
  target: "es2022",
  legalComments: "external",
  banner: {
    js: "/*! Testing OJ host rebuilt 2026-10-09. @live-codes/clang-wasm (MIT), @wasm-idle/llvm-core (MIT AND Apache-2.0 WITH LLVM-exception), browser_wasi_shim (MIT OR Apache-2.0), fflate (MIT). See THIRD-PARTY-NOTICES.md. */",
  },
});
const archive = fs.readFileSync(`${root}/bin/printscan-long-double.a`);
if (
  createHash("sha256").update(archive).digest("hex") !==
  "33e04007d3547095068391b42189d1ac5398dd04e9da3118dfa644ffea7f4148"
)
  throw Error("Wrong WASI SDK 33 printscan archive");
fs.writeFileSync(`${root}/runtime-manifest.v1.json`, originalManifest);
const receipts = Object.fromEntries(
  [
    "runtime-manifest.v1.json",
    "toolchain.js",
    "bin/clang.wasm.gz",
    "bin/lld.wasm.gz",
    "bin/memfs.wasm.gz",
    "bin/sysroot.tar.gz",
    "bin/printscan-long-double.a",
  ].map((name) => {
    const bytes = fs.readFileSync(`${root}/${name}`);
    return [
      name,
      {
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    ];
  }),
);
fs.writeFileSync(
  `${root}/asset-receipts.json`,
  JSON.stringify(receipts, null, 2) + "\n",
);
console.log(
  "Clang 22 runtime built; C++17/20/23 -O2 and long double stdio enabled",
);

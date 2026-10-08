import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const problems = JSON.parse(await fs.readFile("src/problems.json", "utf8"));
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const md = (text) =>
  renderToStaticMarkup(
    createElement(
      Markdown,
      {
        urlTransform: (url) => url,
        remarkPlugins: [remarkMath, remarkGfm],
        rehypePlugins: [[rehypeKatex, { throwOnError: true }]],
      },
      text.replaceAll(
        "./images/",
        pathToFileURL(path.join(root, "public/images/")).href + "/",
      ),
    ),
  );
const css = `
@page{size:A4}*{box-sizing:border-box}body{margin:0;color:#111;font-family:"Times New Roman","Noto Serif CJK SC","SimSun",serif;font-size:10pt;line-height:1.45}header{text-align:center;margin-bottom:6mm}header .contest{font:8pt "Times New Roman";letter-spacing:.7pt;text-transform:uppercase;border-bottom:.6pt solid #222;padding-bottom:3mm;margin-bottom:6mm}h1{font-size:19pt;margin:0 0 1.5mm;line-height:1.45}header .english{font-size:11pt;margin-bottom:3mm}header .limits{font-size:9pt}h2{font-size:14pt;margin:4mm 0 2mm;break-after:avoid}h3{font-size:12pt;margin:4mm 0 2mm;break-after:avoid}p{margin:0 0 2.5mm;text-align:justify}ul,ol{padding-left:6mm;margin:2mm 0 4mm}li{margin-bottom:1.5mm}strong{font-weight:700}code,pre{font-family:"Courier New",monospace;font-size:9pt}code{padding:0 1pt}pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}img{display:block;max-width:90%;max-height:38mm;object-fit:contain;margin:4mm auto}table{width:100%;border-collapse:collapse;font-size:9pt;margin:3mm 0}td,th{border:.5pt solid #aaa;padding:1mm 2mm}hr{border:0;border-top:.5pt solid #aaa;margin:4mm 0}blockquote{border-left:1pt solid #aaa;margin:3mm 0;padding:1mm 4mm;font-size:10pt}blockquote p{margin-bottom:2mm}.katex{font-size:1.02em}.katex-display{margin:3mm 0;break-inside:avoid}.sample{border:.6pt solid #333;margin:3mm 0;break-inside:avoid}.sample .grid{display:grid;grid-template-columns:1fr 1fr}.sample .grid>div+div{border-left:.6pt solid #333}.sample b{display:block;font-weight:400;font-size:9pt;background:#f5f5f5;border-bottom:.5pt solid #aaa;padding:1.5mm 3mm}.sample pre{padding:2.5mm 3mm}.source{border-top:.5pt solid #aaa;margin-top:7mm;padding-top:2mm;font-size:7pt;color:#777}.cover{padding-top:25mm;text-align:center}.cover h1{font-size:27pt;line-height:1.5;margin-bottom:7mm}.cover p{text-align:center;font-size:12pt;margin-bottom:6mm}.cover table{text-align:left;font-size:10pt;margin-top:14mm}.cover table td{padding:2mm 3mm}.cover .label{font-size:11pt;letter-spacing:2pt;color:#666}.cover small{font-size:9pt;color:#666}
`;
await fs.mkdir("tmp/pdfs", { recursive: true });
await fs.mkdir("public/pdf", { recursive: true });
const opts = process.env.BROWSER_BIN
  ? { executablePath: process.env.BROWSER_BIN }
  : {};
const browser = await chromium.launch({ headless: true, ...opts });
const page = await browser.newPage();
const documents = [];
const styles = pathToFileURL(
  path.join(root, "node_modules/katex/dist/katex.min.css"),
).href;
async function render(name, content, footer) {
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><link rel="stylesheet" href="${styles}"><style>${css}${name === 'B' ? 'img{max-height:24mm}' : ''}</style></head><body>${content}</body></html>`;
  const location = path.join(root, "tmp/pdfs", name + ".html");
  await fs.writeFile(location, html);
  await page.goto(pathToFileURL(location).href);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((i) =>
        i.complete
          ? Promise.resolve()
          : new Promise((r) => {
              i.onload = r;
              i.onerror = r;
            }),
      ),
    ),
  );
  if (await page.locator(".katex-error").count())
    throw Error(`${name}: invalid math`);
  const badImages = await page
    .locator("img")
    .evaluateAll((images) =>
      images.filter((i) => !i.naturalWidth).map((i) => i.src),
    );
  if (badImages.length) throw Error("Missing images " + badImages);
  const data = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: "18mm", right: "19mm", bottom: "18mm", left: "19mm" },
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;margin:0 19mm;font:8px Arial;color:#777;display:flex;justify-content:space-between"><span>${footer}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  documents.push(data);
  if (name !== "cover") await fs.writeFile("public/pdf/" + name + ".pdf", data);
  console.log(name, Math.round(data.length / 1024) + " KB");
}
try {
  await render(
    "cover",
    `<div class="cover"><p class="label">PROBLEM SET</p><h1>第六届辽宁省<br>大学生程序设计竞赛</h1><p>The 6th Liaoning Provincial<br>Collegiate Programming Contest</p><p>2025 · Shenyang · 13 Problems</p><table><tbody>${problems.map((p) => `<tr><td>${p.id}</td><td>${escape(p.title)}</td><td>${escape(p.englishTitle)}</td></tr>`).join("")}</tbody></table><small>Chinese statements · Typeset for Testing OJ</small></div>`,
    "LNCPC 2025 / Problem set",
  );
  for (const p of problems) {
    const [body, ...note] = p.markdown.split("\n\n## Note\n\n");
    const header = `<header><div class="contest">The 6th Liaoning Provincial Collegiate Programming Contest · 2025</div><h1>Problem ${p.id}. ${escape(p.title)}</h1><div class="english">${escape(p.englishTitle)}</div><div class="limits">Time Limit: ${p.timeLimit / 1000} seconds &nbsp; | &nbsp; Memory Limit: ${p.memoryLimit} MB<br>Standard Input / Standard Output</div></header>`;
    const samples =
      "<h2>Examples</h2>" +
      p.samples
        .map(
          (s, i) =>
            `<div class="sample"><div class="grid"><div><b>Sample Input ${i + 1}</b><pre>${escape(s.input)}</pre></div><div><b>Sample Output ${i + 1}</b><pre>${escape(s.output)}</pre></div></div></div>`,
        )
        .join("");
    await render(
      p.id,
      header +
      md(body) +
      samples +
        (note.length
          ? "<h2>Note</h2>" + md(note.join("\n\n## Note\n\n"))
        : ""),
      `LNCPC 2025 / Problem ${p.id} · luogu.com.cn/problem/P${14581 + problems.indexOf(p)}`,
    );
  }
  const combined = await PDFDocument.create();
  for (const data of documents) {
    const doc = await PDFDocument.load(data);
    for (const p of await combined.copyPages(doc, doc.getPageIndices()))
      combined.addPage(p);
  }
  combined.setTitle("LNCPC 2025 - Complete Problem Set");
  combined.setAuthor("LNCPC problem setters; typesetting by Testing OJ");
  await fs.writeFile("public/pdf/LNCPC-2025.pdf", await combined.save());
} finally {
  await browser.close();
}

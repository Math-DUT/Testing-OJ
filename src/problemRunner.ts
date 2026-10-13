import type { Language, Problem, RunResult } from "./types";
import { execute } from "./runner";
export const isInteractive = (checker: string) => checker === "hidden-track" || checker === "menji";
export function localScenario(problem: Problem): string {
  return problem.checker === "menji" ? "1\n7\n1 1 2 2 3 3\n0\n" : "1\n3\n0 2 1\n";
}
export async function executeProblem(checker: string, language: Language, source: string, input: string,
  onPhase: (phase: string) => void, maxOutputBytes?: number): Promise<RunResult> {
  if (checker !== "painting-communication" || input.trim().split(/\s+/, 1)[0] !== "1")
    return execute(language, source, input, onPhase, checker === "menji" ? "menji" : checker === "hidden-track", maxOutputBytes);
  // Each run is a new user program. Only the converted image reaches run two.
  const a = input.trim().split(/\s+/).map(Number), [,n,m] = a;
  if (a.some(x => !Number.isSafeInteger(x)) || n < 2 || m < 2 || n > 500000 || m > 500000 || n * m > 1000000 || a.length !== n + 3 || a.slice(3).some(x => x < 1 || x > m))
    return {status:"ERROR",output:"",time:0,error:"通信自测输入：1 n m，之后 n 个特征值；n,m≥2 且 n·m≤10^6。"};
  const limit = 128 * 1024 * 1024;
  const first = await execute(language,source,input,onPhase,false,limit);
  if (first.status !== "OK") return first;
  const words = first.output.trim().split(/\s+/);
  if (words.length !== 3 * n * m || words.some(x => !/^\d+$/.test(x) || Number(x) < 1 || Number(x) > m))
    return {...first,status:"WA",error:"构造阶段必须输出 n 组长度 3m 的颜色序列。"};
  const images = words.map(Number), counts = new Int32Array(m + 1);
  for (let row = 0; row < n; row++) {
    counts.fill(0);
    for (let k = row * 3 * m; k < (row + 1) * 3 * m; k++) counts[images[k]]++;
    if (counts.slice(1).some(x => x !== 3)) return {...first,status:"WA",error:"每种颜色必须在每幅图像中恰好出现 3 次。"};
  }
  let seed = 20251116 ^ n ^ (m << 4), time = first.time;
  const next = () => (seed = (Math.imul(seed,1664525) + 1013904223) >>> 0);
  const rounds = m <= 6 ? (1 << m) - 2 : 4;
  for (let round = 0; round < rounds; round++) {
    const order = Array.from({length:n}, (_,i) => i);
    for (let i = n - 1; i > 0; i--) {const j = next() % (i + 1);[order[i],order[j]] = [order[j],order[i]];}
    const rows: string[] = [], mask = new Uint8Array(m + 1);
    for (const row of order) {
      for (let color = 1; color <= m; color++) mask[color] = m <= 6 ? ((round + 1) >>> (color - 1)) & 1 : round === 0 ? Number(color === 1) : round === 1 ? Number(color !== m) : (next() >>> 16) & 1;
      if (mask.slice(1).every(x => x === mask[1])) {mask[1] = 0;mask[m] = 1;}
      rows.push(images.slice(row * 3 * m,(row + 1) * 3 * m).map(color => mask[color]).join(" "));
    }
    const answer = await execute(language,source,`2 ${n} ${m}\n${rows.join("\n")}\n`,onPhase,false,limit);
    if (answer.status !== "OK") return answer;
    time += answer.time;
    const recovered = answer.output.trim().split(/\s+/);
    if (recovered.length !== n || recovered.some((word,i) => !/^\d+$/.test(word) || Number(word) !== a[3 + order[i]]))
      return {...answer,status:"WA",time,error:`恢复阶段未正确识别特征（第 ${round + 1} 轮转换；图像顺序已打乱）。`};
  }
  return {status:"PASS",output:`通信自测通过：颜色合法，${rounds} 轮转换与乱序恢复正确。\n`,time};
}

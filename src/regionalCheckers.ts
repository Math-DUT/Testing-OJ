// Constructive answers are checked by their behavior, not by sample equality.
export function regionalCheck(checker: string, input: number[], output: string[], reference: string[]): boolean | undefined {
  const integer = (s: string) => /^-?\d+$/.test(s) && Number.isSafeInteger(Number(s));
  if (checker === "hamu") {
    let i = 1, j = 0;
    for (let tc = 0; tc < input[0]; tc++) {
      const n = input[i++], m = input[i++], start = input[i++] - 1;
      const parity = input.slice(i, i + n).map(x => x % 2);i += n;
      const graph: number[][] = Array.from({ length: n }, () => []);
      const roads = new Set<number>();
      for (let e = 0; e < m; e++) {
        const u = input[i++] - 1, v = input[i++] - 1;
        graph[u].push(v);graph[v].push(u);roads.add(u * n + v);roads.add(v * n + u);
      }
      if (output[j++] === "No") {
        const color = new Int8Array(n).fill(-1), queue = [start];color[start] = 0;
        let bipartite = true, odd = 0;
        for (let q = 0; q < queue.length; q++) {
          const u = queue[q];odd ^= parity[u];
          for (const v of graph[u]) {
            if (color[v] < 0) { color[v] = color[u] ^ 1;queue.push(v); }
            else if (color[v] === color[u]) bipartite = false;
          }
        }
        if (!parity.some((x, v) => x && color[v] < 0) && (!bipartite || !odd)) return false;
      } else {
        if (output[j - 1] !== "Yes" || !integer(output[j])) return false;
        const k = Number(output[j++]);if (k < 0 || k > 5 * n) return false;
        let current = start;
        for (let q = 0; q < k; q++) {
          if (!integer(output[j])) return false;
          const v = Number(output[j++]) - 1;
          if (v < 0 || v >= n || !roads.has(current * n + v)) return false;
          parity[v] ^= 1;current = v;
        }
        if (current !== start || parity.some(Boolean)) return false;
      }
    }
    return i === input.length && j === output.length;
  }
  if (checker === "fake-sort") {
    let i = 1, j = 0, r = 0;
    for (let tc = 0; tc < input[0]; tc++) {
      const n = input[i++], p = input.slice(i, i + n);i += n;
      if (!integer(reference[r]) || !integer(output[j])) return false;
      const expected = Number(reference[r++]);if (expected !== -1) r += 2 * expected;
      const count = Number(output[j++]);
      if (count === -1) { if (expected !== -1) return false;continue; }
      if (count < 0 || count > 114) return false;
      for (let op = 0; op < count; op++) {
        if (!integer(output[j]) || !integer(output[j + 1])) return false;
        const l = Number(output[j++]) - 1, end = Number(output[j++]);
        if (l < 0 || end > n || l >= end || (end - l) % 2) return false;
        const values = p.slice(l, end).sort((a, b) => a - b), half = values.length / 2;
        const threshold = values[half];let low = 0, high = half;
        for (let v = l; v < end; v++) p[v] = p[v] < threshold ? values[low++] : values[high++];
      }
      if (p.some((v, index) => v !== index + 1)) return false;
    }
    return i === input.length && j === output.length;
  }
  if (checker === "leo") {
    const n = input[0];if (input.length !== 1 || !integer(output[0])) return false;
    const m = Number(output[0]);if (m < 1 || m > 6 * n || output.length !== 1 + 3 * m) return false;
    const gates: [string, number, number][] = [];
    for (let i = 0; i < m; i++) {
      const [op, a, b] = output.slice(1 + 3 * i, 4 + 3 * i);
      if (!["&", "|"].includes(op) || !integer(a) || !integer(b) || Number(a) < 1 || Number(b) < 1 || Number(a) >= n + i + 1 || Number(b) >= n + i + 1) return false;
      gates.push([op, Number(a), Number(b)]);
    }
    const state = new Uint8Array(n + m + 1);
    const simulate = () => {
      let seen = 0, target = 0;
      for (let i = 1; i <= n; i++) {
        const value = state[i];
        if (value && !(seen & (1 << value))) {seen |= 1 << value;if (seen === 14) target = value;}
      }
      if (!target) return true; // Only inputs containing R, G and B are valid.
      for (let i = 0; i < m; i++) {
        const [op, u, v] = gates[i], a = state[u], b = state[v];
        state[n + i + 1] = op === "&" ? (a === b ? a : 0) : (a === b ? a : a ^ b);
      }
      return state[n + m] === target;
    };
    if (n <= 9) {
      for (let mask = 0; mask < 4 ** n; mask++) {
        let value = mask;
        for (let i = 1; i <= n; i++) {state[i] = value & 3;value >>>= 2;}
        if (!simulate()) return false;
      }
    } else {
      let seed = 20251116;
      const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
      const permutations = [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
      for (let test = 0; test < Math.floor(10 ** 7 / n); test++) {
        for (let i = 1; i <= n; i++) state[i] = test < 6 ? 0 : (next() >>> 16) & 3;
        const positions = test < 6 ? [1, Math.ceil(n / 2), n] : Array.from({length:3}, () => next() % n + 1);
        if (new Set(positions).size !== 3) {test--;continue;}
        const colors = permutations[test % 6];
        positions.forEach((pos, k) => {state[pos] = colors[k];});
        if (!simulate()) return false;
      }
    }
    return true;
  }
  return undefined;
}

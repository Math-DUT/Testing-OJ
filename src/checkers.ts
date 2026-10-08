const tokens = (s: string) => s.trim().split(/\s+/).filter(Boolean);
function integers(s: string): number[] {
  return tokens(s).map((x) => {
    if (!/^-?\d+$/.test(x)) throw Error();
    const n = Number(x);
    if (!Number.isSafeInteger(n)) throw Error();
    return n;
  });
}
export function checkOutput(
  checker: string,
  input: string,
  output: string,
  expected: string,
): boolean {
  try {
    if (checker === "float-1e-9") {
      const a = tokens(output).map(Number),
        b = tokens(expected).map(Number);
      return (
        a.length === b.length &&
        a.every(
          (x, i) =>
            Number.isFinite(x) &&
            Math.abs(x - b[i]) <= 1e-9 * Math.max(1, Math.abs(b[i])),
        )
      );
    }
    if (checker === "recall") {
      const a = tokens(input),
        lines = tokens(output);
      let cursor = 1;
      if (lines.length !== Number(a[0])) return false;
      for (const sequence of lines) {
        const n = Number(a[cursor++]),
          ops: [string, number][] = [];
        for (let i = 0; i < n; i++)
          ops.push([a[cursor++], Number(a[cursor++])]);
        const stack: number[] = [],
          present = new Set<number>();
        let i = 0;
        for (const char of sequence) {
          if (char === "-") {
            if (!stack.length) return false;
            present.delete(stack.pop()!);
          } else {
            if (i >= n) return false;
            const [op, x] = ops[i++];
            if (char === "+") {
              if (op !== "+" || present.has(x)) return false;
              stack.push(x);
              present.add(x);
            } else if (char === "?") {
              if (!["T", "F"].includes(op) || present.has(x) !== (op === "T"))
                return false;
            } else return false;
          }
        }
        if (i !== n) return false;
      }
      return cursor === a.length;
    }
    if (checker === "lcm-permutation") {
      const a = integers(input),
        b = integers(output);
      let i = 1,
        j = 0;
      const gcd = (x: bigint, y: bigint): bigint => (y ? gcd(y, x % y) : x);
      for (let tc = 0; tc < a[0]; tc++) {
        const n = a[i++],
          p = b.slice(j, j + n);
        j += n;
        if (
          p.length !== n ||
          new Set(p).size !== n ||
          p.some((x) => x < 1 || x > n)
        )
          return false;
        let value = 1n;
        for (let k = 0; k < n; k++) {
          const s = BigInt(p[k] + p[(k + 1) % n]);
          value = (value / gcd(value, s)) * s;
          if (value > BigInt(20 * n)) return false;
        }
      }
      return j === b.length;
    }
    if (checker === "permutation-inversions") {
      const a = integers(input),
        b = integers(output),
        e = integers(expected);
      let i = 1,
        j = 0,
        k = 0;
      const inv = (p: number[]) =>
        p.reduce(
          (sum, x, i) => sum + p.slice(i + 1).filter((y) => y < x).length,
          0,
        );
      for (let tc = 0; tc < a[0]; tc++) {
        const n = a[i++],
          m = a[i++],
          constraints: number[][] = [];
        for (let c = 0; c < m; c++) {
          const l = a[i++],
            r = a[i++];
          constraints.push(a.slice(i, i + r - l + 1));
          i += r - l + 1;
        }
        if (e[k] === -1) {
          k++;
          if (b[j++] !== -1) return false;
          continue;
        }
        if (b[j] === -1) return false;
        const p = b.slice(j, j + n),
          optimal = e.slice(k, k + n);
        j += n;
        k += n;
        if (
          p.length !== n ||
          new Set(p).size !== n ||
          p.some((x) => x < 1 || x > n)
        )
          return false;
        if (
          constraints.some((q) =>
            q.some((x, t) => t > 0 && p[q[t - 1] - 1] >= p[x - 1]),
          )
        )
          return false;
        if (inv(p) !== inv(optimal)) return false;
      }
      return j === b.length;
    }
    if (checker === "wolf-game") {
      const a = tokens(input),
        b = tokens(output),
        e = tokens(expected);
      let i = 1,
        j = 0,
        k = 0;
      for (let tc = 0; tc < Number(a[0]); tc++) {
        const n = Number(a[i++]),
          d = a[i++],
          counts = a.slice(i, i + n).map(Number);
        i += n;
        if (e[k] === "-1") {
          k++;
          if (b[j++] !== "-1") return false;
          continue;
        }
        if (e[k]?.length === n) k++;
        else k += n;
        let p: number[];
        if (b[j]?.length === n && /^[01]+$/.test(b[j]))
          p = b[j++].split("").map(Number);
        else {
          p = b.slice(j, j + n).map(Number);
          j += n;
        }
        if (
          p.length !== n ||
          p.some((x) => x !== 0 && x !== 1) ||
          p.some((x, t) => x === 1 && p[t + 1] === 1)
        )
          return false;
        if (
          p.some(
            (x, t) =>
              x === 0 &&
              p
                .slice(d[t] === "L" ? 0 : t + 1, d[t] === "L" ? t : n)
                .reduce((s, y) => s + y, 0) !== counts[t],
          )
        )
          return false;
      }
      return j === b.length;
    }
    if (checker === "xor-closed") {
      const a = integers(input),
        b = integers(output),
        e = integers(expected);
      const n = a[0],
        m = a[1],
        count = b[0],
        added = b.slice(1);
      if (
        count !== e[0] ||
        added.length !== count ||
        new Set(added).size !== count ||
        added.some((x) => x < 0 || x >= 2 ** m)
      )
        return false;
      let i = 2;
      for (let tc = 0; tc < n; tc++) {
        const len = a[i++],
          set = new Set([...a.slice(i, i + len), ...added]);
        i += len;
        if (!set.has(0)) return false;
        const basis = Array(m).fill(0);
        let rank = 0;
        for (let x of set) {
          for (let bit = m - 1; bit >= 0; bit--) {
            if (!((x >> bit) & 1)) continue;
            if (basis[bit]) x ^= basis[bit];
            else {
              basis[bit] = x;
              rank++;
              break;
            }
          }
        }
        if (set.size !== 2 ** rank) return false;
      }
      return i === a.length;
    }
    if (checker === "mex") {
      const a = integers(input),
        b = integers(output);
      let i = 1,
        j = 0;
      for (let tc = 0; tc < a[0]; tc++) {
        const n = a[i++],
          r = a.slice(i, i + n),
          c = a.slice(i + n, i + 2 * n);
        i += 2 * n;
        const matrix = b.slice(j, j + n * n);
        j += n * n;
        if (matrix.length !== n * n || matrix.some((x) => x < 0 || x > n))
          return false;
        for (let k = 0; k < n; k++) {
          const row = new Set(matrix.slice(k * n, (k + 1) * n)),
            col = new Set(
              Array.from({ length: n }, (_, x) => matrix[x * n + k]),
            );
          let rm = 0,
            cm = 0;
          while (row.has(rm)) rm++;
          while (col.has(cm)) cm++;
          if (rm !== r[k] || cm !== c[k]) return false;
        }
      }
      return j === b.length;
    }
    if (checker === "keyboard") {
      const a = integers(input),
        b = tokens(output);
      let i = 1,
        j = 0;
      const ref = tokens(expected);
      let refIndex = 0;
      for (let tc = 0; tc < a[0]; tc++) {
        const m = BigInt(a[i++]),
          k = a[i++],
          missing = new Set(a.slice(i, i + k));
        i += k;
        const expectedImpossible = ref[refIndex] === "-1";
        if (expectedImpossible) refIndex++;
        else {
          const count = Number(ref[refIndex++]);
          refIndex += 2 * count;
        }
        const count = Number(b[j++]);
        if (count === -1) {
          if (!expectedImpossible) return false;
          continue;
        }
        if (!Number.isInteger(count) || count < 1 || count > 100) return false;
        let value = 0n,
          positive = false;
        for (let t = 0; t < count; t++) {
          const digit = Number(b[j++]),
            raw = b[j++];
          if (!raw || !/^\d+$/.test(raw)) return false;
          let length = BigInt(raw);
          if (
            !Number.isInteger(digit) ||
            digit < 0 ||
            digit > 9 ||
            missing.has(digit) ||
            length < 1n ||
            length > 10n ** 18n
          )
            return false;
          positive ||= digit > 0;
          let pow = 10n % m,
            sum = 1n % m,
            resultPow = 1n % m,
            resultSum = 0n;
          while (length > 0n) {
            if (length & 1n) {
              resultSum = (resultSum * pow + sum) % m;
              resultPow = (resultPow * pow) % m;
            }
            sum = (sum * (pow + 1n)) % m;
            pow = (pow * pow) % m;
            length >>= 1n;
          }
          value = (value * resultPow + BigInt(digit) * resultSum) % m;
        }
        if (!positive || value !== 0n) return false;
      }
      return j === b.length;
    }
    if (checker === "gulls") {
      const a = integers(input),
        b = tokens(output),
        decisions = expected.match(/\b(?:Yes|No)\b/gi) || [];
      let i = 1,
        j = 0;
      for (let tc = 0; tc < a[0]; tc++) {
        const n = a[i++],
          birds = new Map<number, [number, number]>(),
          food = new Set<string>(),
          occupied = new Set<string>();
        for (let k = 1; k <= n; k++) {
          const r = a[i++],
            c = a[i++];
          birds.set(k, [r, c]);
          occupied.add(`${r},${c}`);
        }
        for (let k = 0; k < n; k++) food.add(`${a[i++]},${a[i++]}`);
        const decision = b[j++];
        if (decision === "No") {
          if (decisions[tc] !== "No") return false;
          continue;
        }
        if (decision !== "Yes") return false;
        for (let k = 0; k < n; k++) {
          const id = Number(b[j++]),
            direction = b[j++],
            bird = birds.get(id);
          if (!bird) return false;
          const delta: Record<string, [number, number]> = {
            U: [-1, 0],
            D: [1, 0],
            L: [0, -1],
            R: [0, 1],
          };
          if (!delta[direction]) return false;
          let [r, c] = bird;
          const [dr, dc] = delta[direction];
          occupied.delete(`${r},${c}`);
          do {
            r += dr;
            c += dc;
          } while (occupied.has(`${r},${c}`));
          if (!food.delete(`${r},${c}`)) return false;
          birds.delete(id);
        }
        if (food.size) return false;
      }
      return j === b.length;
    }
    return tokens(output).join(" ") === tokens(expected).join(" ");
  } catch {
    return false;
  }
}

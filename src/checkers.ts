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

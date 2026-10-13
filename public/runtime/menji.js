/* Local adaptive interactor for Shanghai 2025 A. Hidden 0 means adaptive. */
class MenjiJudge {
  constructor(input) {
    const tokens = input.trim().split(/\s+/);
    if (tokens.some(x => !/^\d+$/.test(x))) throw Error('交互场景必须包含有效整数');
    const a = tokens.map(Number);let i = 1, total = 0;
    if (a[0] < 1 || a[0] > 100) throw Error('测试组数超出范围');
    this.cases = [];
    for (let tc = 0; tc < a[0]; tc++) {
      const n = a[i++];total += n;
      if (n < 2 || n > 30000 || total > 30000) throw Error('树的规模超出范围');
      const parents = a.slice(i, i + n - 1);i += n - 1;
      if (parents.length !== n - 1) throw Error('父节点数量不正确');
      const graph = Array.from({length:n}, () => []), children = new Uint8Array(n);
      for (let v = 1; v < n; v++) {
        const p = parents[v - 1] - 1;
        if (p < 0 || p >= v || ++children[p] > 2) throw Error('必须是以 1 为根的二叉树');
        graph[p].push(v);graph[v].push(p);
      }
      const hidden = a[i++];
      if (hidden < 0 || hidden > n || !Number.isInteger(hidden)) throw Error('隐藏节点应为 0（自适应）或 1..n');
      this.cases.push({n, parents, graph, hidden});
    }
    if (i !== a.length) throw Error('交互场景包含多余数据');
    this.index = 0;this.queries = 0;this.pending = '';this.error = '';
    this.stdin = `${this.cases.length}\n` + this.startCase();
  }
  startCase() {
    const current = this.cases[this.index];
    if (!current) return '';
    this.candidates = current.hidden ? [current.hidden - 1] : Array.from({length:current.n}, (_, i) => i);
    return `${current.n}\n${current.parents.join(' ')}\n`;
  }
  fail(message) {this.error ||= message;return '-1\n';}
  write(text) {
    this.pending += text;let response = '';
    while (this.pending.includes('\n')) {
      const end = this.pending.indexOf('\n'), line = this.pending.slice(0,end).trim();
      this.pending = this.pending.slice(end + 1);
      if (!line || this.error) continue;
      const parts = line.split(/\s+/), symbol = parts.shift(), current = this.cases[this.index];
      if (!current) {response += this.fail('全部回答后仍有多余输出');continue;}
      if (parts.some(x => !/^\d+$/.test(x))) {response += this.fail('交互输出包含无效整数');continue;}
      const values = parts.map(Number);
      if (symbol === '?') {
        const [u,k] = values;
        if (values.length !== 2 || u < 1 || u > current.n || k < 0 || k > current.n) {response += this.fail('信号参数超出范围');continue;}
        if (++this.queries > 40) {response += this.fail('超过每组 40 次信号限制');continue;}
        const distance = new Int32Array(current.n).fill(-1), queue = [u - 1];distance[u - 1] = 0;
        for (let i = 0; i < queue.length; i++) for (const v of current.graph[queue[i]])
          if (distance[v] < 0) {distance[v] = distance[queue[i]] + 1;queue.push(v);}
        const yes = [], no = [];
        for (const v of this.candidates) (distance[v] <= k ? yes : no).push(v);
        const answer = yes.length >= no.length ? 1 : 0;
        this.candidates = answer ? yes : no;response += `${answer}\n`;
      } else if (symbol === '!') {
        if (values.length !== 1 || this.candidates.length !== 1 || values[0] - 1 !== this.candidates[0]) {response += this.fail('隐藏节点尚未唯一确定或答案不正确');continue;}
        this.index++;this.queries = 0;response += this.startCase();
      } else response += this.fail('交互输出必须以 ? 或 ! 开头');
    }
    this.stdin += response;return response;
  }
  finish() {
    if (this.pending.trim()) this.write('\n');
    if (!this.error && this.index !== this.cases.length) this.error = '程序结束前没有回答全部测试组';
    return {status:this.error ? 'WA' : 'PASS',error:this.error};
  }
}
globalThis.MenjiJudge = MenjiJudge;

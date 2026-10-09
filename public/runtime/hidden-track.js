/* Deterministic local interactor for ICPC EC 2026 Online II, Hidden Track. */
class HiddenTrackJudge {
  constructor(input) {
    const a = input.trim().split(/\s+/).map(Number);
    if (a.some(x => !Number.isSafeInteger(x)) || a[0] < 1 || a[0] > 10000)
      throw Error('隐藏排列格式不正确');
    let i = 1;
    this.paths = [];
    for (let tc = 0; tc < a[0]; tc++) {
      const n = a[i++], p = a.slice(i, i + n); i += n;
      if (!Number.isSafeInteger(n) || n < 1 || n > 1000) throw Error('隐藏排列格式不正确');
      if (p.length !== n || new Set(p).size !== n || p.some(x => !Number.isInteger(x) || x < 0 || x >= n) || (n > 1 && p[0] >= p[n-1]))
        throw Error('隐藏排列格式不正确');
      this.paths.push(p);
    }
    if (!this.paths.length || i !== a.length) throw Error('隐藏排列格式不正确');
    if (this.paths.reduce((sum,p)=>sum+p.length,0)>10000) throw Error('隐藏排列总长度超出范围');
    this.graphs = this.paths.map(p => {
      const k=Math.ceil(Math.log2(p.length)), spectrum=new Int32Array(2**k);
      const neighbors=Array.from({length:p.length},()=>[]);
      for(let j=1;j<p.length;j++) {
        spectrum[p[j-1]^p[j]]++;
        neighbors[p[j-1]].push(p[j]); neighbors[p[j]].push(p[j-1]);
      }
      for(let step=1;step<spectrum.length;step*=2)
        for(let start=0;start<spectrum.length;start+=2*step)
          for(let j=0;j<step;j++) {
            const x=spectrum[start+j],y=spectrum[start+j+step];
            spectrum[start+j]=x+y;spectrum[start+j+step]=x-y;
          }
      return {neighbors,baseline:Array.from(spectrum,x=>(p.length-1-x)/2)};
    });
    this.index = 0; this.queries = 0; this.pending = ''; this.error = '';
    this.stdin = `${this.paths.length}\n${this.paths[0].length}\n`;
  }
  fail(message) { this.error ||= message; return '-1\n'; }
  write(text) {
    this.pending += text;
    let response = '';
    while (this.pending.includes('\n')) {
      const end = this.pending.indexOf('\n'), line = this.pending.slice(0, end).trim();
      this.pending = this.pending.slice(end+1);
      if (!line) continue;
      if (this.error) continue;
      const tokens = line.split(/\s+/), symbol = tokens.shift();
      if (tokens.some(x => !/^-?\d+$/.test(x))) { response += this.fail('交互输出包含无效整数'); continue; }
      const a = tokens.map(Number), p = this.paths[this.index];
      if (!p) { response += this.fail('答案结束后仍有多余输出'); continue; }
      const n = p.length, k = Math.ceil(Math.log2(n));
      if (symbol === '?') {
        const [m,v] = a;
        if (a.length !== 2 || m < 0 || m >= 2**k || v < -1 || v >= n) { response += this.fail('查询参数超出范围'); continue; }
        if (++this.queries > n*k) { response += this.fail('超过 n·ceil(log2(n)) 次查询限制'); continue; }
        const member = x => {
          let bits = x & m, parity = 0;
          while (bits) { parity ^= 1; bits &= bits - 1; }
          return parity;
        };
        const graph=this.graphs[this.index];let crossing=graph.baseline[m];
        if(v!==-1)for(const w of graph.neighbors[v])crossing+=member(v)===member(w)?1:-1;
        response += `${((crossing % 3)+3)%3}\n`;
      } else if (symbol === '!') {
        if (a.length !== n || a.some((x,i) => x !== p[i])) { response += this.fail('隐藏排列重建错误'); continue; }
        this.index++; this.queries = 0;
        if (this.paths[this.index]) response += `${this.paths[this.index].length}\n`;
      } else response += this.fail('交互输出必须以 ? 或 ! 开头');
    }
    this.stdin += response;
    return response;
  }
  finish() {
    if (this.pending.trim()) this.write('\n');
    if (!this.error && this.index !== this.paths.length) this.error = '程序结束前没有回答全部隐藏排列';
    return { status: this.error ? 'WA' : 'PASS', error: this.error };
  }
}
globalThis.HiddenTrackJudge = HiddenTrackJudge;

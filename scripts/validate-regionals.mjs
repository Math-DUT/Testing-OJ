import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadCheckers} from './load-checkers.mjs';
const checker=await loadCheckers(),context=vm.createContext({});
vm.runInContext(await fs.readFile('public/runtime/menji.js','utf8'),context);
let samples=0,protocols=0;
for(const city of ['shenyang','shanghai']){
  const problems=JSON.parse(await fs.readFile(`src/data/icpc-${city}-2025.json`,'utf8'));
  assert.equal(problems.length,13);
  for(const [index,p] of problems.entries()){
    assert.equal(p.id,String.fromCharCode(65+index));assert(p.markdown.length>300);
    assert.equal(p.statementFormat,'markdown');assert(p.timeLimit>0&&p.memoryLimit>0);
    assert((await fs.readFile('public/'+p.pdf.slice(2))).subarray(0,4).toString()==='%PDF');
    for(const t of p.tests){
      if(t.file){
        const bytes=await fs.readFile('public/'+t.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),t.sha256);
        const data=JSON.parse(gunzipSync(bytes));assert.equal(Buffer.byteLength(data.input),t.inputBytes);protocols++;
        if(p.checker==='menji')assert(new context.MenjiJudge(data.input).stdin.startsWith('1\n'));
        else{
          const a=data.input.trim().split(/\s+/).map(Number),[,n,m]=a;
          assert(n>=2&&m>=2&&n*m<=1e6&&a.length===n+3&&a.slice(3).every(x=>x>=1&&x<=m));
        }
      }else{
        assert(checker.checkOutput(p.checker,t.input,t.output,t.output),`${city}/${p.id}: official sample construction rejected`);samples++;
      }
    }
  }
}
// Alternative valid Hamu visits, malformed routes, and exact impossibility.
assert(checker.checkOutput('hamu','1\n2 1 1\n1 1\n1 2\n','Yes\n6\n2 1 2 1 2 1\n','Yes\n2\n2 1\n'));
assert(!checker.checkOutput('hamu','1\n2 1 1\n1 1\n1 2\n','No','Yes\n2\n2 1\n'));
assert(checker.checkOutput('hamu','1\n2 1 1\n1 0\n1 2\n','No','No'));
assert(!checker.checkOutput('hamu','1\n2 1 1\n1 1\n1 2\n','Yes\n2\n1 2\n','Yes\n2\n2 1\n'));
assert(checker.checkOutput('fake-sort','1\n4\n1 2 3 4\n','1\n1 4\n','0\n'));
assert(!checker.checkOutput('fake-sort','1\n4\n2 1 4 3\n','0\n','1\n1 4\n'));
assert(!checker.checkOutput('leo','4\n','1\n| 1 2\n',''));
let judge=new context.MenjiJudge('2\n2\n1\n0\n3\n1 2\n3\n');
assert.equal(judge.write('? 1 0\n'),'1\n');assert.equal(judge.write('! 1\n'),'3\n1 2\n');
assert.equal(judge.write('? 1 0\n'),'0\n');assert.equal(judge.write('! 3\n'),'');assert.equal(judge.finish().status,'PASS');
judge=new context.MenjiJudge('1\n3\n1 2\n0\n');judge.write('! 1\n');assert.equal(judge.finish().status,'WA');
judge=new context.MenjiJudge('1\n2\n1\n0\n');judge.write('? 1 2\n'.repeat(41));assert.equal(judge.finish().status,'WA');
assert.throws(()=>new context.MenjiJudge('1\n4\n1 1 1\n0\n'));
console.log(`26 regional statements; ${samples} checked sample files; ${protocols} constraint-valid protocol files; constructive and adaptive-judge checks passed.`);

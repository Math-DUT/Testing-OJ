/* Browser-only execution. Upstream runtime: binji/wasm-clang, Apache-2.0. */
importScripts('./cpp/shared.js');
let api, compiled, lastSource='', output='', stage='loading';
const MAX_OUTPUT=2*1024*1024;
const write=s=>{output+=s;if(output.length>MAX_OUTPUT)throw Error('OUTPUT_LIMIT');};
async function bytes(file){const r=await fetch(file);if(!r.ok)throw Error(`无法加载 C++ 环境：${r.status}`);return r.arrayBuffer();}
const phase=p=>{stage=p;postMessage({type:'phase',phase:p});};
self.onmessage=async ({data:{source,input}})=>{
  output='';let start=0;
  try{
    phase('loading');
    if(!api){
      api=new API({clang:'./cpp/clang',lld:'./cpp/lld',memfs:'./cpp/memfs',sysroot:'./cpp/sysroot.tar',readBuffer:bytes,compileStreaming:async file=>WebAssembly.compile(await bytes(file)),hostWrite:write});
      api.hostLog=()=>{};api.hostWrite=()=>{};
      await api.ready;
      api.memfs.addFile('include/bits/stdc++.h',['algorithm','array','bitset','cassert','cctype','cerrno','cfloat','chrono','climits','cmath','complex','cstdint','cstdio','cstdlib','cstring','deque','functional','iomanip','ios','iostream','iterator','limits','list','map','memory','numeric','queue','random','set','sstream','stack','stdexcept','string','tuple','type_traits','unordered_map','unordered_set','utility','vector'].map(h=>`#include <${h}>`).join('\n'));
      api.clangCommonArgs.push('-std=c++17');
      await Promise.all([api.getModule(api.clangFilename),api.getModule(api.lldFilename)]);
    }
    if(lastSource!==source || !compiled){
      phase('compiling');output='';
      // Unique objects prevent a failed compile from executing an earlier binary.
      const name='p'+Date.now();
      await api.compile({input:name+'.cc',obj:name+'.o',contents:source});
      await api.link(name+'.o',name+'.wasm');
      compiled=await WebAssembly.compile(api.memfs.getFileContents(name+'.wasm').slice());lastSource=source;
    }
    output='';api.memfs.setStdinStr(input);phase('running');start=performance.now();
    await api.run(compiled,'program.wasm');
    postMessage({type:'result',result:{status:'OK',output,time:performance.now()-start}});
  }catch(e){postMessage({type:'result',result:{status:String(e).includes('OUTPUT_LIMIT')?'OLE':stage==='compiling'?'CE':stage==='running'?'RE':'ERROR',output:output.replace(/\x1b\[[0-9;]*m/g,''),error:e.stack||String(e),time:start?performance.now()-start:0}});if(stage==='loading')api=null;}
};

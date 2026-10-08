/* Browser-only execution. Upstream runtime: binji/wasm-clang, Apache-2.0. */
importScripts('./cpp/shared.js');
importScripts('./hidden-track.js');
let api, compiled, lastSource='', output='', stage='loading';
let judge, currentFd = 1, stderr = '';
// The upstream MemFS callback combines stdout and stderr. Preserve the fd
// before that callback, so debug messages never become interactive queries.
const instantiate = WebAssembly.instantiate.bind(WebAssembly);
WebAssembly.instantiate = function(module, imports) {
  if (imports?.env?.host_write && imports.env.copy_in) {
    const original = imports.env.host_write;
    imports.env.host_write = function(fd, ...args) {
      currentFd = fd;
      try { return original(fd, ...args); }
      finally { currentFd = 1; }
    };
  }
  return instantiate(module, imports);
};
const MAX_OUTPUT=2*1024*1024;
const write=s=>{
  if(stage==='running' && currentFd===2){stderr+=s;if(stderr.length>MAX_OUTPUT)throw Error('OUTPUT_LIMIT');return;}
  output+=s;if(output.length>MAX_OUTPUT)throw Error('OUTPUT_LIMIT');
  if(judge && stage==='running'){const response=judge.write(s);api.memfs.stdinStr+=response;}
};
async function bytes(file){const r=await fetch(file);if(!r.ok)throw Error(`无法加载 C++ 环境：${r.status}`);return r.arrayBuffer();}
const phase=p=>{stage=p;postMessage({type:'phase',phase:p});};
self.onmessage=async ({data:{source,input,interactive}})=>{
  output='';stderr='';judge=null;let start=0;
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
    output='';judge=interactive?new HiddenTrackJudge(input):null;
    api.memfs.setStdinStr(judge?judge.stdin:input);phase('running');start=performance.now();
    await api.run(compiled,'program.wasm');
    postMessage({type:'result',result:{status:'OK',error:stderr,...(judge?.finish()||{}),output,time:performance.now()-start}});
  }catch(e){postMessage({type:'result',result:{status:String(e).includes('OUTPUT_LIMIT')?'OLE':stage==='compiling'?'CE':stage==='running'?'RE':'ERROR',output:output.replace(/\x1b\[[0-9;]*m/g,''),error:e.stack||String(e),time:start?performance.now()-start:0}});if(stage==='loading')api=null;}
};

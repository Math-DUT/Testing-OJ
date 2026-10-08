import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs';
import './hidden-track.js';
let runtime;
self.onmessage=async ({data:{source,input,interactive}})=>{
  let start=0;
  try{
    postMessage({type:'phase',phase:'loading'});
    runtime ||= await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
    const judge=interactive?new globalThis.HiddenTrackJudge(input):null;
    runtime.globals.set('_source',source);runtime.globals.set('_input',judge?judge.stdin:input);
    runtime.globals.set('_interactive',!!judge);
    runtime.globals.set('_judge_write',text=>judge?.write(text)||'');
    postMessage({type:'phase',phase:'running'});start=performance.now();
    const answer=await runtime.runPythonAsync(`
import sys, io, traceback, json
class LimitedOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 2 * 1024 * 1024:
            raise RuntimeError('OUTPUT_LIMIT')
        return super().write(text)
class InteractiveInput(io.TextIOWrapper):
    def __init__(self, text):
        super().__init__(io.BytesIO(text.encode()), encoding='utf-8')
    def append(self, text):
        self.flush()
        pos = self.tell()
        self.buffer.seek(0, 2)
        self.buffer.write(text.encode())
        self.seek(pos)
class InteractiveOutput(LimitedOutput):
    def write(self, text):
        result = super().write(text)
        _stdin.append(str(_judge_write(text)))
        return result
_stdin = InteractiveInput(_input) if _interactive else io.TextIOWrapper(io.BytesIO(_input.encode()))
_out, _err = LimitedOutput(), LimitedOutput()
if _interactive:
    _out = InteractiveOutput()
_oldin, _oldout, _olderr = sys.stdin, sys.stdout, sys.stderr
sys.stdin, sys.stdout, sys.stderr = _stdin, _out, _err
_status, _error = 'OK', ''
try:
    exec(compile(_source, 'main.py', 'exec'), {'__name__': '__main__'})
except SystemExit as e:
    if e.code not in (None, 0):
        _status, _error = 'RE', str(e)
except BaseException as e:
    _status = 'OLE' if 'OUTPUT_LIMIT' in str(e) else 'CE' if isinstance(e, SyntaxError) else 'RE'
    _error = traceback.format_exc()
finally:
    sys.stdin, sys.stdout, sys.stderr = _oldin, _oldout, _olderr
json.dumps({'status': _status, 'output': _out.getvalue(), 'error': _error or _err.getvalue()})
`);
    const result=JSON.parse(answer);
    if(judge && result.status==='OK')Object.assign(result,judge.finish());
    postMessage({type:'result',result:{...result,time:performance.now()-start}});
  }catch(e){postMessage({type:'result',result:{status:'ERROR',output:'',error:String(e),time:0}});runtime=null;}
};

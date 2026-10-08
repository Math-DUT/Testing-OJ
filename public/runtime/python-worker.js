import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs';
let runtime;
self.onmessage=async ({data:{source,input}})=>{
  let start=0;
  try{
    postMessage({type:'phase',phase:'loading'});
    runtime ||= await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
    runtime.globals.set('_source',source);runtime.globals.set('_input',input);
    postMessage({type:'phase',phase:'running'});start=performance.now();
    const answer=await runtime.runPythonAsync(`
import sys, io, traceback, json
class LimitedOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 2 * 1024 * 1024:
            raise RuntimeError('OUTPUT_LIMIT')
        return super().write(text)
_out, _err = LimitedOutput(), LimitedOutput()
_oldin, _oldout, _olderr = sys.stdin, sys.stdout, sys.stderr
sys.stdin, sys.stdout, sys.stderr = io.TextIOWrapper(io.BytesIO(_input.encode())), _out, _err
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
    postMessage({type:'result',result:{...JSON.parse(answer),time:performance.now()-start}});
  }catch(e){postMessage({type:'result',result:{status:'ERROR',output:'',error:String(e),time:0}});runtime=null;}
};

let worker: Worker | undefined;
let cancel: (() => void) | undefined;
export function stopJudge() {
  worker?.terminate();worker = undefined;cancel?.();cancel = undefined;
}
export function judgeOutput(checker: string,input: string,output: string,expected: string): Promise<boolean> {
  worker ??= new Worker(new URL("./checker-worker.ts", import.meta.url), {type:"module"});
  const current=worker;
  return new Promise((resolve,reject)=>{
    cancel=()=>resolve(false);
    current.onmessage=({data})=>{cancel=undefined;resolve(data);};
    current.onerror=(error)=>{cancel=undefined;stopJudge();reject(Error(error.message||"输出校验失败。"));};
    current.postMessage({checker,input,output,expected});
  });
}

/* Clang 22.1.8 + WASI SDK 33. See cpp22/THIRD-PARTY-NOTICES.md. */
importScripts('./cpp22/toolchain.js', './hidden-track.js');
let toolchain, compiled, lastSource = '', lastStandard = '', stage = 'loading';
const MAX_OUTPUT = 2 * 1024 * 1024;
const phase = (value) => { stage = value; postMessage({type: 'phase', phase: value}); };
self.onmessage = async ({data: {source, input, interactive, standard = '17'}}) => {
  let output = '', stderr = '', start = 0;
  try {
    if (!['17', '20', '23'].includes(standard)) throw Error('不支持的 C++ 标准');
    phase('loading');
    toolchain ??= await clangWasmToolchain.createToolchain({baseUrl: new URL('./cpp22/', self.location.href).href});
    if (!compiled || source !== lastSource || standard !== lastStandard) {
      phase('compiling');
      const build = await toolchain.captureCompilerOutput(() => toolchain.runtime.compileArtifact(source, {
        language: 'CPP', fileName: 'main.cpp',
        compileArgs: [...clangWasmToolchain.CLANG_DRIVER_DEFAULT_ARGS, `-std=c++${standard}`, '-O2'],
      }));
      if (build.error) {
        const error = clangWasmToolchain.compilerDiagnostics(build.raw).join('\n') || String(build.error);
        postMessage({type: 'result', result: {status: 'CE', output: '', error, time: 0}});
        return;
      }
      compiled = build.result;
      lastSource = source; lastStandard = standard;
    }
    const judge = interactive ? new HiddenTrackJudge(input) : null;
    let pendingInput = judge ? judge.stdin : input;
    phase('running'); start = performance.now();
    const result = await toolchain.execute(compiled, {
      stdin: () => { const chunk = pendingInput; pendingInput = ''; return chunk || null; },
      stdout: (chunk) => {
        output += chunk;
        if (output.length > MAX_OUTPUT) throw Error('OUTPUT_LIMIT');
        if (judge) pendingInput += judge.write(chunk);
      },
      stderr: (chunk) => { stderr += chunk; if (stderr.length > MAX_OUTPUT) throw Error('OUTPUT_LIMIT'); },
    });
    postMessage({type: 'result', result: {
      status: result.exitCode === 0 ? 'OK' : 'RE',
      error: stderr || (result.exitCode ? `退出码 ${result.exitCode}` : ''),
      ...(judge?.finish() || {}), output, time: performance.now() - start,
    }});
  } catch (e) {
    postMessage({type: 'result', result: {
      status: String(e).includes('OUTPUT_LIMIT') ? 'OLE' : stage === 'compiling' ? 'CE' : stage === 'running' ? 'RE' : 'ERROR',
      output, error: (e.message || String(e)) + (stage === 'running' ? '\n' + (e.stack || '') : ''), time: start ? performance.now() - start : 0,
    }});
    if (stage === 'loading') toolchain = null;
  }
};

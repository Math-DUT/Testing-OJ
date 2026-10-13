"""Vendor the pinned official npm Pyodide runtime for same-origin loading."""
import hashlib,json,pathlib,tarfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
archive=ROOT/'tmp/pyodide-0.27.7.tgz';folder=ROOT/'public/runtime/pyodide';folder.mkdir(parents=True,exist_ok=True)
assets=[]
with tarfile.open(archive) as package:
    metadata=json.loads(package.extractfile('package/package.json').read())
    assert metadata['version']=='0.27.7' and metadata['license']=='MPL-2.0'
    for name in ['pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']:
        data=package.extractfile('package/'+name).read();(folder/name).write_bytes(data)
        assets.append(dict(file=name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
for name,source in [('LICENSE-PYODIDE.txt','pyodide-license.txt'),('LICENSE-CPYTHON.txt','cpython-license.txt')]:
    (folder/name).write_bytes((ROOT/'tmp'/source).read_bytes())
(folder/'runtime-manifest.json').write_text(json.dumps(dict(version='0.27.7',
    source='https://registry.npmjs.org/pyodide/-/pyodide-0.27.7.tgz',
    packageSHA256=hashlib.sha256(archive.read_bytes()).hexdigest(),assets=assets),indent=2)+'\n',encoding='utf8',newline='\n')
(folder/'THIRD-PARTY-NOTICES.md').write_text('''# Pyodide 0.27.7

Unmodified official npm runtime, published by the Pyodide project. Loaded from
the same origin as Testing OJ; built-in Python modules work without a CDN.

Pyodide: MPL-2.0, LICENSE-PYODIDE.txt.
CPython and its standard library: Python Software Foundation license,
LICENSE-CPYTHON.txt. Additional component notices are included in that license.

Source: https://github.com/pyodide/pyodide/tree/0.27.7
Archive and exact asset checksums: runtime-manifest.json.

Rebuild: npm pack pyodide@0.27.7 --pack-destination tmp, retrieve the two
upstream licenses, then run python scripts/vendor-python-runtime.py.
''',encoding='utf8',newline='\n')
print('Vendored Pyodide 0.27.7:',sum(a['bytes'] for a in assets),'bytes')

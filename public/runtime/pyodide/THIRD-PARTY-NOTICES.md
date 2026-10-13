# Pyodide 0.27.7

Unmodified official npm runtime, published by the Pyodide project. Loaded from
the same origin as Testing OJ; built-in Python modules work without a CDN.

Pyodide: MPL-2.0, LICENSE-PYODIDE.txt.
CPython and its standard library: Python Software Foundation license,
LICENSE-CPYTHON.txt. Additional component notices are included in that license.

Source: https://github.com/pyodide/pyodide/tree/0.27.7
Archive and exact asset checksums: runtime-manifest.json.

Rebuild: npm pack pyodide@0.27.7 --pack-destination tmp, retrieve the two
upstream licenses, then run python scripts/vendor-python-runtime.py.

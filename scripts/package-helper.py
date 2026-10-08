"""Build the small cross-platform helper zip without bundling interpreters."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1] / "public" / "local"
with zipfile.ZipFile(root / "pypy-helper.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for name in ("testing_oj_runner.py", "start-pypy.ps1", "启动 PyPy3.cmd", "README.md"):
        archive.write(root / name, "PyPy3-Helper/" + name)
print("PyPy3 helper packaged")

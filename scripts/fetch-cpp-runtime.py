"""Vendor the pinned Apache-2.0 browser compiler and its license files."""
import urllib.request, json, pathlib, concurrent.futures, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPO='binji/wasm-clang'
def download(item):
    name,commit=item
    path=ROOT/'public/runtime/cpp'/name
    path.parent.mkdir(parents=True,exist_ok=True)
    data=urllib.request.urlopen(f'https://raw.githubusercontent.com/{REPO}/{commit}/{name}',timeout=120).read()
    if name in ['clang','lld','memfs']: assert data[:4]==b'\x00asm'
    path.write_bytes(data)
    print(name,len(data),flush=True)
    return {'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
if __name__=='__main__':
    commit=json.load(urllib.request.urlopen(f'https://api.github.com/repos/{REPO}/commits/master'))['sha']
    names=['clang','lld','memfs','sysroot.tar','shared.js','LICENSE','LICENSE.llvm']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex: manifest=list(ex.map(download,[(n,commit) for n in names]))
    (ROOT/'public/runtime/cpp/manifest.json').write_text(json.dumps({'repository':REPO,'commit':commit,'files':manifest},indent=2))

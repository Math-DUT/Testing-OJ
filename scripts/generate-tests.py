"""Generate exactly 15 public self-test files per problem, including 3 trick files.

Official samples are kept separately in statements. Small generated cases use
exhaustive oracles; large special cases use documented exact identities. These
files are not the original contest's hidden data and do not prove official AC.
"""
import json,pathlib,random,sys,hashlib,gzip,argparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/test-data'))
import stress_liaoning as liaoning, stress_online1 as online1, stress_online2 as online2

if __name__=='__main__':
    sources=[('lncpc-2025','src/problems.json',liaoning),
        ('icpc-online-2026-1','src/data/icpc-online-2026-1.json',online1),
        ('icpc-online-2026-2','src/data/icpc-online-2026-2.json',online2)]
    parser=argparse.ArgumentParser();parser.add_argument('--contest');parser.add_argument('--problem');args=parser.parse_args()
    packroot=ROOT/'public/test-data';packroot.mkdir(exist_ok=True)
    for cid,path,module in sources:
        if args.contest and args.contest!=cid:continue
        p=ROOT/path;data=json.loads(p.read_text(encoding='utf-8'))
        for problem in data:
            if args.problem and args.problem!=problem['id']:continue
            cases=[];rng=random.Random(int.from_bytes(hashlib.sha256(f'{cid}/{problem["id"]}'.encode()).digest()[:8],'big'))
            # Interactive examples show a transcript, not stdin. Use hidden
            # permutations and execute them against the actual local interactor.
            # Official examples stay in the statement. All 12 ordinary files
            # are now generated pressure files, not example duplicates.
            # Reserve the three boundary files before filling ordinary cases so
            # a random draw cannot duplicate a trick or an official sample.
            tricks=[]
            for t in range(3):
                input_,output,label=module.make(problem['id'],t,t,rng)
                tricks.append(dict(input=input_,output=output,label=label,kind='trick'))
            seen={c['input'] for c in cases+tricks}
            for i in range(12-len(cases)):
                for attempt in range(1000):
                    input_,output,label=module.make(problem['id'],i,None,rng)
                    if input_ not in seen:break
                else:raise ValueError(f'{cid}/{problem["id"]}: not enough distinct inputs')
                seen.add(input_)
                cases.append(dict(input=input_,output=output,label=label,kind='regular'))
            cases+=tricks
            assert len(cases)==15 and sum(c['kind']=='trick' for c in cases)==3
            assert len({c['input'] for c in cases})==15,f'{cid}/{problem["id"]}: duplicate inputs'
            # Every input is a separate file; generated outputs are deterministic.
            folder=packroot/cid/problem['id'];folder.mkdir(parents=True,exist_ok=True)
            metadata=[]
            for i,case in enumerate(cases,1):
                raw=json.dumps(dict(input=case['input'],output=case['output']),separators=(',',':'),ensure_ascii=False).encode()
                packed=gzip.compress(raw,compresslevel=6,mtime=0);digest=hashlib.sha256(packed).hexdigest()
                # .bin prevents servers from transparently decoding the gzip.
                name=f'{i:02d}-{digest[:16]}.bin';(folder/name).write_bytes(packed)
                ibytes=len(case['input'].encode());obytes=len(case['output'].encode())
                maxout=min(128*1024*1024,max(2*1024*1024,obytes*4+1024*1024))
                if problem['checker']=='keyboard':maxout=128*1024*1024
                metadata.append(dict(input='',output='',label=case['label'],kind=case['kind'],
                    file=f'test-data/{cid}/{problem["id"]}/{name}',sha256=digest,
                    inputBytes=ibytes,outputBytes=obytes,maxOutputBytes=maxout))
            # Remove only previous generated packs in this exact problem folder.
            keep={pathlib.Path(t['file']).name for t in metadata}
            for old in folder.glob('*.bin'):
                if old.name not in keep:old.unlink()
            problem['tests']=metadata
            if cid=='icpc-online-2026-1':
                problem['checker']={'A':'recall','C':'permutation-inversions','E':'lcm-permutation','K':'wolf-game'}.get(problem['id'],'tokens')
            if cid=='icpc-online-2026-2':
                problem['checker']={'A':'xor-closed','B':'float-1e-9','H':'hidden-track'}.get(problem['id'],'tokens')
            print(cid,problem['id'],'15 cases / 3 trick',sum(len(c['input']) for c in cases),'input bytes',flush=True)
        p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Rebuild the whole manifest even after a targeted regeneration.
    manifest=[]
    for cid,path,module in sources:
        for problem in json.loads((ROOT/path).read_text(encoding='utf-8')):
            tests=problem['tests']
            manifest.append(dict(contest=cid,problem=problem['id'],count=len(tests),trick=sum(t['kind']=='trick' for t in tests),
                oracle=module.__name__,inputBytes=sum(t.get('inputBytes',len(t['input'].encode())) for t in tests),
                maxInputBytes=max(t.get('inputBytes',len(t['input'].encode())) for t in tests),
                outputBytes=sum(t.get('outputBytes',len(t['output'].encode())) for t in tests),
                sha256=hashlib.sha256(json.dumps(tests,ensure_ascii=False).encode()).hexdigest()))
    (ROOT/'src/data/test-manifest.json').write_text(json.dumps(dict(seed='SHA-256 of contest/problem',
        scope='Public constraint-valid stress data, independently checked references and structural identities; not official hidden tests.',
        problems=manifest),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

"""Generate exactly 15 public self-test files per problem, including 3 trick files.

Official samples are kept separately in statements. Small generated cases use
exhaustive oracles; large special cases use documented exact identities. These
files are not the original contest's hidden data and do not prove official AC.
"""
import importlib.util,json,pathlib,random,sys,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/test-data'))
import liaoning, online1, online2

if __name__=='__main__':
    sources=[('lncpc-2025','src/problems.json',liaoning),
        ('icpc-online-2026-1','src/data/icpc-online-2026-1.json',online1),
        ('icpc-online-2026-2','src/data/icpc-online-2026-2.json',online2)]
    manifest=[]
    for cid,path,module in sources:
        p=ROOT/path;data=json.loads(p.read_text(encoding='utf-8'))
        for problem in data:
            cases=[];rng=random.Random(int.from_bytes(hashlib.sha256(f'{cid}/{problem["id"]}'.encode()).digest()[:8],'big'))
            interactive=cid=='icpc-online-2026-2' and problem['id']=='H'
            # Interactive examples show a transcript, not stdin. Use hidden
            # permutations and execute them against the actual local interactor.
            for i,sample in enumerate([] if interactive else problem['samples']):
                cases.append(dict(**sample,label=f'公开样例 {i+1}',kind='sample'))
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
            assert len({c['input'] for c in cases})==15,f'{cid}/{problem["id"]}: duplicate sample/trick inputs'
            # Every input is a separate file; generated outputs are deterministic.
            problem['tests']=cases
            if cid=='icpc-online-2026-1':
                problem['checker']={'A':'recall','C':'permutation-inversions','E':'lcm-permutation','K':'wolf-game'}.get(problem['id'],'tokens')
            if cid=='icpc-online-2026-2':
                problem['checker']={'A':'xor-closed','B':'float-1e-9','H':'hidden-track'}.get(problem['id'],'tokens')
            manifest.append(dict(contest=cid,problem=problem['id'],count=15,trick=3,
                oracle=module.__name__,sha256=hashlib.sha256(json.dumps(cases,ensure_ascii=False).encode()).hexdigest()))
            print(cid,problem['id'],'15 cases / 3 trick',flush=True)
        p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'src/data/test-manifest.json').write_text(json.dumps(dict(seed='SHA-256 of contest/problem',
        scope='Public self-test data: exhaustive small cases and exact special cases, not official hidden tests.',
        problems=manifest),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

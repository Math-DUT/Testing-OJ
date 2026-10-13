"""Protocol scenarios have known hidden data and need no assumed solution."""
import gzip,hashlib,json,pathlib,random
ROOT=pathlib.Path(__file__).resolve().parents[1]
def pack(cid,letter,cases):
    path=ROOT/f'src/data/{cid}.json';problems=json.loads(path.read_text(encoding='utf8'))
    problem=next(p for p in problems if p['id']==letter);folder=ROOT/f'public/test-data/{cid}/{letter}';folder.mkdir(parents=True,exist_ok=True)
    tests=[]
    for i,(input_,label) in enumerate(cases):
        raw=json.dumps({'input':input_,'output':''},separators=(',',':')).encode();packed=gzip.compress(raw,mtime=0)
        sha=hashlib.sha256(packed).hexdigest();name=f'{i+1:02}-{sha[:16]}.bin';(folder/name).write_bytes(packed)
        tests.append(dict(input='',output='',file=f'test-data/{cid}/{letter}/{name}',sha256=sha,
            inputBytes=len(input_.encode()),outputBytes=0,maxOutputBytes=128*1024*1024,
            label=label,kind='trick' if i>=12 else 'regular'))
    keep={pathlib.Path(t['file']).name for t in tests}
    for old in folder.glob('*.bin'):
        if old.name not in keep:old.unlink()
    problem['tests']=tests;problem['testScope']='protocol'
    path.write_text(json.dumps(problems,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(cid,letter,len(tests),'protocol cases')

rng=random.Random(20251123);cases=[]
sizes=[7,31,63,127,511,1023,3000,8000,15000,30000,29999,30000,2,3,7]
for index,n in enumerate(sizes):
    if index%3==0:parents=[v-1 for v in range(2,n+1)]
    elif index%3==1:parents=[v//2 for v in range(2,n+1)]
    else:
        open_=[1];counts=[0]*(n+1);parents=[]
        for v in range(2,n+1):
            position=rng.randrange(len(open_));p=open_[position];parents.append(p);counts[p]+=1
            if counts[p]==2:open_[position]=open_[-1];open_.pop()
            open_.append(v)
    hidden=0 if index%2 else rng.choice([1,n,n//2])
    cases.append((f'1\n{n}\n'+ ' '.join(map(str,parents))+f'\n{hidden}\n','自适应 / 固定隐藏节点、深链和非平衡二叉树'))
pack('icpc-shanghai-2025','A',cases)
cases=[]
for index,(n,m) in enumerate([(4,7),(7,10),(10,20),(20,30),(30,50),(50,80),(100,100),
    (300,1000),(1000,1000),(2,500000),(500000,2),(999,1001),(2,2),(3,3),(5,3)]):
    features=[rng.randint(1,m) for _ in range(n)]
    if index>=12:features=[j%m+1 for j in range(n)]
    cases.append((f'1 {n} {m}\n'+'\n'.join(map(str,features))+'\n','随机特征、乱序恢复、非空颜色划分与规模边界'))
pack('icpc-shenyang-2025','C',cases)

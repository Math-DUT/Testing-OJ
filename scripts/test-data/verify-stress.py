"""Independent exhaustive checks for every accelerated reference identity."""
import itertools, random, subprocess, pathlib, sys, math
import liaoning as ln, online1 as one, online2 as two
import stress_online1 as large_one
ROOT=pathlib.Path(__file__).resolve().parents[2]
BIN=ROOT/'tmp/fast-oracles.exe'
def solve(mode,s):
    p=subprocess.run([str(BIN),mode],input=s,text=True,capture_output=True,check=True)
    return p.stdout
def equal(a,b,tag):
    assert str(a).split()==str(b).split(), (tag,a,b)
rng=random.Random(20261009)
for z in range(120):
    a=[rng.randint(1,10**9) for _ in range(rng.randint(1,25))]
    equal(solve('entering',ln.one_array(a)),ln.entering(a),'entering')
    s=''.join(rng.choice('01') for _ in range(rng.randint(1,12)))
    equal(solve('kanon','1\n'+s+'\n'),ln.kanon(s),s)
    a=[rng.randint(0,20) for _ in range(rng.randint(1,15))]
    equal(solve('loop',ln.one_array(a)),two.loop(a),a)
    a=[rng.randint(0,12) for _ in range(rng.randint(1,10))];ks=list(range(15));ans=0
    for k in ks:ans^=two.kmex(a,k)
    equal(solve('kmex',ln.one_array(a)+str(len(ks))+'\n'+ln.line(ks)),ans,('kmex',a))
for n in range(1,5):
    equal(solve('ghost','1\n'+str(n)+'\n'),two.ghost(n),('ghost',n))
for n in range(1,301):equal(solve('exponent','1\n'+str(n)+'\n'),two.exponent(n),('exponent',n))
for z in range(100):
    h=rng.randint(1,3);cs=[(rng.randrange(1,1<<(h+1)),rng.randrange(1,(1<<h)+1)) for _ in range(rng.randrange(6))]
    equal(solve('divide',f'{h} {len(cs)}\n'+''.join(ln.line(x) for x in cs)),two.divide(h,cs),('divide',h,cs))
for a in itertools.product(range(4),repeat=4):
    x=a[0]
    for v in sorted(a[1:]):x=max(x,(x+v+1)//2)
    equal(x,ln.cards(a),('cards',a))
for n in range(2,13):
    equal(one.sequence_count(one.sequence(('01'*n)[:n])),2**((n+1)//2),('sequence alt',n))
    for r in range(2,n):
        equal(one.sequence_count(one.sequence('0'*r+'1'*(n-r))),2 if 2*r>=n else 4,('sequence blocks',n,r))
for n in range(3,8):
    for z in range(10):
        a=[rng.randint(1,3) for _ in range(n)];r=a.count(3)
        valid=0 if r>2 else __import__('math').comb(n-r,2-r)*__import__('math').factorial(n-2)
        value=(pow(n,n-2,ln.MOD)-__import__('math').factorial(n)//2+valid)%ln.MOD
        equal(value,ln.stars(a),('stars',a))
for z in range(80):
    a=[rng.randint(1,2) for _ in range(rng.randint(1,3))]
    m=len(a);p=rng.randint(0,m);s=rng.randint(0,m-p);rounds=2
    inp=f'1\n{rounds} {m} {p} {s}\n'+ln.line(a);answers=[]
    for _ in range(rounds):
        answers.append('Alice' if ln.game(tuple(a)) else 'Bob')
        a=[sum(a[j:p]) if j<p else sum(a[m-s:j+1]) if j>=m-s else x for j,x in enumerate(a)]
    equal(solve('stones',inp),'\n'.join(answers),'stones game simulation')
    pairs=[(rng.randint(0,12),rng.randint(0,12)) for _ in range(rng.randint(1,8))]
    current=answer=0
    for a,b in sorted(pairs,key=lambda pair:(max(pair),min(pair))):
        if current<=a:current=max(current,b);answer+=1
    equal(answer,ln.capoo(pairs),('capoo subset DP',pairs))
    rows=[tuple(rng.randrange(2) for _ in range(3)) for _ in range(rng.randint(1,25))]
    equal(solve('red',str(len(rows))+'\n'+''.join(ln.line(row) for row in rows)),one.red(rows),'red quadratic DP')
    strings=[''.join(rng.choice('abc') for _ in range(rng.randint(1,8))) for _ in range(rng.randint(1,7))]
    equal(solve('prefixes',str(len(strings))+'\n'+'\n'.join(strings)+'\n'),one.prefix_answers(strings),'prefixes all subsets')
for shape in ['chain','star']:
    for z in range(40):
        n=rng.randint(1,20);weights=[0]+[rng.randint(1,100) for _ in range(1,n)]
        parents=[-1]+[j-1 if shape=='chain' else 0 for j in range(1,n)]
        depth=[0]*n
        for j in range(1,n):depth[j]=depth[parents[j]]+weights[j]
        def distance(x,y):
            ancestors={x:0};d=0;v=x
            while v: d+=weights[v];v=parents[v];ancestors[v]=d
            d=0
            while y not in ancestors:d+=weights[y];y=parents[y]
            return d+ancestors[y]
        work=[0]*n;ops=[];expected=[]
        for j in range(40):
            x=rng.randrange(n);subtree=list(range(x,n)) if shape=='chain' or x==0 else [x]
            if j%3==0:
                ops.append(f'2 {x+1}\n');expected.append(sum(work[v] for v in subtree))
            else:
                y=rng.randrange(n);ops.append(f'1 {x+1} {y+1}\n')
                for v in subtree:work[v]+=distance(v,y)
        inp=shape+'\n'+f'{n} {len(ops)}\n'+''.join(f'{parents[j]+1} {weights[j]}\n' for j in range(1,n))+''.join(ops)
        equal(solve('mail',inp),ln.line(expected),'mail independent distances and updates')
for z in range(40):
    n=rng.randint(2,30);edges=[(rng.randrange(j),j) for j in range(1,n)]
    rng.shuffle(edges);weights=[rng.randint(1,100) for _ in range(n)];queries=[];expected=[]
    for _ in range(20):
        l=rng.randint(1,n-1);r=rng.randint(l,n-1);f=rng.randint(l,r);queries.append((l,r,f))
        expected.append(two.components(n,[edge for j,edge in enumerate(edges,1) if l<=j<=r and j!=f],weights))
    inp='1\n'+str(n)+'\n'+''.join(ln.line((a+1,b+1)) for a,b in edges)+ln.line(weights)+str(len(queries))+'\n'+''.join(ln.line(q) for q in queries)
    equal(solve('cut',inp),ln.line(expected),'cut full-graph connected components')
    s=''.join(rng.choice('NH') for _ in range(rng.randint(1,30)))
    ops=[(rng.randint(1,4),rng.randint(1,len(s)),rng.randint(0,20)) for _ in range(20)]
    equal(large_one.apply_big(s,ops),one.string_ops(s,ops),'string arithmetic versus step simulation')
    n=rng.randint(3,8);edges=[(rng.randrange(j),j) for j in range(1,n)]
    equal(solve('folding','1\n'+str(n)+'\n'+''.join(ln.line((a+1,b+1)) for a,b in edges)),two.folding(n,tuple(edges)),'folding every legal fold')
    children=[[] for _ in range(n)];children[0]=[1,2]
    for j in range(3,n):children[rng.randrange(j)].append(j)
    for row in children:rng.shuffle(row)
    equal(solve('island','1\n'+str(n)+'\n'+''.join(ln.line([len(row)]+[v+1 for v in row]) for row in children)),two.island(children),'island all edge subsets')
    n=rng.randint(3,120);a=rng.randint(1,100);b=rng.randint(-1,1);c=rng.randint(1,5)
    points=[(a*t+b*t*(n-1-t),c*t*(n-1-t)) for t in range(n-1,-1,-1)]
    param=float(solve('bread',f'parabola\n1\n{n} {a} {b} {c}\n'))
    brute=float(solve('bread','plain\n1\n'+str(n)+'\n'+''.join(ln.line(p) for p in points)))
    assert math.isclose(param,brute,rel_tol=1e-12,abs_tol=1e-12),('bread roots versus exhaustive farthest points',param,brute)
for n in range(3,8):
    stirling=[0]*(n-1);stirling[0]=1
    for j in range(1,n-1):
        for k in range(j,0,-1):stirling[k]=(stirling[k-1]+k*stirling[k])%ln.MOD
        stirling[0]=0
    for threshold in range(1,n+1):
        answer=sum(math.comb(n,l)*math.factorial(n-l)*stirling[n-l] for l in range(threshold,n) if n-l<len(stirling))%ln.MOD
        equal(answer,ln.stars([threshold]*n),('uniform stars',n,threshold))
print('Accelerated references passed randomized/exhaustive comparisons, including all accelerated native modes.')

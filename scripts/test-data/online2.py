"""Small exhaustive oracles for ICPC 2026 EC Online II.

Bread data uses rectangles. During each quarter-turn the farthest corner sweeps
the upper circle of radius hypot(w,h). Consecutive equal-radius arcs meet at the
midpoints between contact vertices. Integrating these arcs over perimeter
2(w+h) gives 2*(F(w/2)+F(h/2))/(w+h), F(t)=integral_0^t sqrt(R^2-x^2)dx.
"""
from functools import lru_cache
from itertools import combinations,product,permutations
from math import sqrt,asin,gcd,factorial
from liaoning import line, MOD

def closed(sets,m):
    universe=range(1<<m)
    for k in range((1<<m)+1):
        for added in combinations(universe,k):
            merged_sets=[set(s)|set(added) for s in sets]
            if all(all(x^y in merged for x in merged for y in merged) for merged in merged_sets):
                return str(k)+'\n'+line(added)
    raise AssertionError()

def bread(w,h):
    rr=w*w+h*h
    def integral(x):return (x*sqrt(rr-x*x)+rr*asin(x/sqrt(rr)))/2
    return 2*(integral(w/2)+integral(h/2))/(w+h)

def components(n,edges,weights=None):
    parent=list(range(n))
    def find(x):
        while x!=parent[x]:x=parent[x]
        return x
    for a,b in edges:
        a,b=find(a),find(b);parent[a]=b
    sums={}
    for i in range(n):r=find(i);sums[r]=sums.get(r,0)+(weights[i] if weights else 1)
    return max(sums.values()) if weights else len(sums)

def divide(n,cs):
    leaves=1<<n
    if not cs:return factorial(leaves)%MOD
    if any(u==1 and x!=leaves for u,x in cs):return 0
    total=0
    for p in permutations(range(1,leaves+1)):
        a=[0]*(leaves*2);a[leaves:]=p
        for i in range(leaves-1,0,-1):a[i]=max(a[i*2:i*2+2])
        total+=all(a[u]==x for u,x in cs)
    return total%MOD

def exponent(n):
    if n==1:return 1
    ans=0
    for a in range(1,n+1):
        if gcd(a,n)>1:continue
        v=a%n;k=1
        while v!=1:v=v*a%n;k+=1
        ans+=k
    return ans

@lru_cache(None)
def folding(n,edges):
    if n==1:return 0
    graph=[[] for _ in range(n)]
    for a,b in edges:graph[a].append(b);graph[b].append(a)
    paths=[];diam=0
    for s in range(n):
        def dfs(v,p,path):
            nonlocal diam,paths
            if len(path)>diam:diam=len(path);paths=[]
            if len(path)==diam:paths.append(path)
            for w in graph[v]:
                if w!=p:dfs(w,v,path+(w,))
        dfs(s,-1,(s,))
    best=0
    for path in paths:
        mapping=list(range(n))
        for i,v in enumerate(path):mapping[v]=path[min(i,len(path)-1-i)]
        vertices=sorted(set(mapping));newid={v:i for i,v in enumerate(vertices)}
        newedges=tuple(sorted(set(tuple(sorted((newid[mapping[a]],newid[mapping[b]]))) for a,b in edges if mapping[a]!=mapping[b])))
        best=max(best,1+folding(len(vertices),newedges))
    return best

@lru_cache(None)
def ghost(n):
    intervals=[]
    for start in range(n):
        for length in range(1,n+1):
            vs=sum(1<<((start+i)%n) for i in range(length));es=sum(1<<((start+i)%n) for i in range(length-1));intervals.append((vs,es))
    conflict=[]
    for i,(v,e) in enumerate(intervals):
        mask=0
        for j,(w,f) in enumerate(intervals[:i]):
            if (v&w==w and e&f==f) or (v&w==v and e&f==e):mask|=1<<j
        conflict.append(mask)
    out1=[0]*n;out2=[0]*n
    def dfs(i,chosen,vs,es):
        if i==len(intervals):
            for k in range(1,n+1):out1[k-1]+=max(es)<=k;out2[k-1]+=max(vs)<=k
            return
        dfs(i+1,chosen,vs,es)
        if not chosen&conflict[i]:
            v,e=intervals[i];dfs(i+1,chosen|(1<<i),[x+(v>>j&1) for j,x in enumerate(vs)],[x+(e>>j&1) for j,x in enumerate(es)])
    dfs(0,0,[0]*n,[0]*n)
    return line(out1)+line(out2)

def island(children):
    n=len(children);edges=[(i,j) for i,row in enumerate(children) for j in row];leaves=[]
    def visit(v):
        if not children[v]:leaves.append(v)
        for w in children[v]:visit(w)
    visit(0);edges+=list(zip(leaves,leaves[1:]));total=0
    for mask in range(1<<len(edges)):total+=components(n,[edge for i,edge in enumerate(edges) if mask>>i&1])
    return total*pow(1<<len(edges),-1,MOD)%MOD

def kmex(a,k):
    best=0
    for mask in range(1<<len(a)):
        b={k-x if mask>>i&1 else x for i,x in enumerate(a)};m=0
        while m in b:m+=1
        best=max(best,m)
    return best
def loop(a):
    n=len(a);dp=[[10**30]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):dp[i][j]=(min(dp[i-1][j] if i else 10**30,dp[i][j-1] if j else 10**30) if i or j else 0)+a[(i-j)%n]
    return dp[-1][-1]

def make(letter,index,trick,rng):
    label=f'随机场景 {index+1}'
    if letter=='A':
        if trick==0:m=3;sets=[[2],[0,2,7],[1,2,3,4,6,7]];label='加入元素影响所有集合'
        elif trick==1:m=3;sets=[[0,1,2,3],[0,4]];label='集合已经 XOR 闭合'
        elif trick==2:m=3;sets=[[1],[2],[4]];label='缺少零与多集合相互限制'
        else:m=rng.randint(1,3);sets=[rng.sample(range(1<<m),rng.randint(1,1<<m)) for _ in range(rng.randint(1,4))]
        inp=f'{len(sets)} {m}\n'+''.join(line([len(s)]+s) for s in sets);out=closed(sets,m)
    elif letter=='B':
        w,h=[(1,1),(10**9,10**9),(10**9,1)][trick] if trick is not None else (rng.randint(1,1000),rng.randint(1,1000))
        if trick is not None:label=['单位正方形','最大坐标的正方形','极薄长方形的浮点精度'][trick]
        inp=f'1\n4\n{w} 0\n{w} {h}\n0 {h}\n0 0\n';out=f'{bread(w,h):.15f}\n'
    elif letter=='C':
        n=2 if trick==0 else rng.randint(3,12);edges=[(i,rng.randrange(i)) for i in range(1,n)];rng.shuffle(edges);weights=[rng.randint(1,100) for _ in range(n)];queries=[]
        for _ in range(12):
            l=rng.randint(1,n-1);r=rng.randint(l,n-1);f=rng.randint(l,r)
            if trick==1:l=r=f
            if trick==2:l=1;r=n-1
            queries.append((l,r,f))
        if trick is not None:label=['两点树删除唯一边','区间只含被删除的边','全树删除边切成两部分'][trick]
        inp=f'1\n{n}\n'+''.join(f'{u+1} {v+1}\n' for u,v in edges)+line(weights)+str(len(queries))+'\n'+''.join(line(q) for q in queries)
        out=''.join(f'{components(n,[e for i,e in enumerate(edges,1) if l<=i<=r and i!=f],weights)}\n' for l,r,f in queries)
    elif letter=='D':
        if trick==0:n=18;cs=[];label='没有限制，十八层阶乘取模'
        elif trick==1:n=3;cs=[(1,7)];label='根节点值必须是最大叶值'
        elif trick==2:n=2;cs=[(4,1),(4,2)];label='同一节点相互矛盾的约束'
        else:n=rng.randint(1,3);cs=[(rng.randint(1,(1<<(n+1))-1),rng.randint(1,1<<n)) for _ in range(rng.randint(0,5))]
        inp=f'{n} {len(cs)}\n'+''.join(line(q) for q in cs);out=f'{divide(n,cs)}\n'
    elif letter=='E':
        nums=[[1],[8,16,32,64],[6,12,30,60]][trick] if trick is not None else [rng.randint(1,250) for _ in range(5)]
        if trick is not None:label=['模数 1 的定义','二的幂的非循环单位群','非互素元素阶为零'][trick]
        inp=str(len(nums))+'\n'+''.join(f'{n}\n' for n in nums);out=''.join(f'{exponent(n)}\n' for n in nums)
    elif letter=='F':
        n=[1,10,10][trick] if trick is not None else rng.randint(1,9)
        edges=[(i,i-1) for i in range(1,n)] if trick==1 else [(0,i) for i in range(1,n)] if trick==2 else [(i,rng.randrange(i)) for i in range(1,n)]
        if trick is not None:label=['单顶点无需折叠','长链重复折叠','多条直径可选择的星形树'][trick]
        inp=f'1\n{n}\n'+''.join(f'{u+1} {v+1}\n' for u,v in edges);out=f'{folding(n,tuple(sorted(tuple(sorted(e)) for e in edges)))}\n'
    elif letter=='G':
        ns=[[1,2,3],[3,2,1],[4,1]][trick] if trick is not None else [rng.randint(1,5) for _ in range(rng.randint(1,3))]
        if trick is not None:label=['单点自环和两条平行边','每组重置且边顶点覆盖不同','跨越环尾的区间'][trick]
        inp=str(len(ns))+'\n'+''.join(f'{n}\n' for n in ns);out=''.join(ghost(n) for n in ns)
    elif letter=='H':
        n=[1,3,8][trick] if trick is not None else rng.randint(2,12);p=list(range(n));rng.shuffle(p)
        if n>=2 and p[0]>p[-1]:p.reverse()
        if trick is not None:label=['n=1 无需查询','非二的幂与异或掩码','二的幂与查询上限'][trick]
        inp=f'1\n{n}\n'+line(p);out='! '+line(p)
    elif letter=='I':
        n=[3,6,8][trick] if trick is not None else rng.randint(3,8);children=[[] for _ in range(n)];children[0]=[1,2]
        for i in range(3,n):children[rng.randrange(i)].append(i)
        if trick==1:children[0].reverse()
        if trick==2:children=[list(range(1,n))]+[[] for _ in range(1,n)]
        if trick is not None:label=['三点树形成三角形','DFS 子节点顺序影响叶链','所有孩子都是叶子'][trick]
        inp=f'1\n{n}\n'+''.join(line([len(row)]+[x+1 for x in row]) for row in children);out=f'{island(children)}\n'
    elif letter=='J':
        kinds={'WrongProblem':100,'SameProblem':30,'UnreasonableLimitForProblem':5,'WeakTestsForProblem':3,'BadProblem':1}
        if trick==0:reviews=[];budget=0;label='没有评价'
        elif trick==1:reviews=['WrongProblemA','WrongProblemM','WrongProblema','WrongProblemAA'];budget=100;label='大小写、题号范围和严格大于'
        elif trick==2:reviews=['BadProblemL']*9;budget=8;label='重复评价每次都计分'
        else:reviews=[rng.choice(list(kinds)+'UnreasonableProblemArrangement'.split())+rng.choice(['A','L','M','a','AA','']) for _ in range(rng.randint(1,20))];budget=rng.randint(0,500)
        def value(s):
            if s=='UnreasonableProblemArrangement':return 10
            for prefix,cost in kinds.items():
                if s.startswith(prefix) and len(s)==len(prefix)+1 and 'A'<=s[-1]<='L':return cost
            return 0
        inp=f'1\n{len(reviews)} {budget}\n'+'\n'.join(reviews)+('\n' if reviews else '');out='Joker\n' if sum(map(value,reviews))>budget else 'Judger\n'
    elif letter=='K':
        if trick==0:a=[0,0,0];queries=[0,1,2];label='重复元素不能生成所有值'
        elif trick==1:a=[10**9,0,1];queries=[0,10**9,10**9-1];label='最大 k 与变换后负数'
        elif trick==2:a=list(range(8));queries=[0,7,7,14];label='重复查询答案异或抵消'
        else:a=[rng.randint(0,30) for _ in range(rng.randint(1,10))];queries=[rng.randint(0,40) for _ in range(8)]
        answer=0
        for k in queries:answer^=kmex(a,k)
        inp=f'1\n{len(a)}\n'+line(a)+str(len(queries))+'\n'+''.join(f'{k}\n' for k in queries);out=f'{answer}\n'
    elif letter=='L':
        a=[[7],[10**9]*30,[0,10**9,0,10**9]][trick] if trick is not None else [rng.randint(0,30) for _ in range(rng.randint(1,25))]
        if trick is not None:label=['起点终点是同一格','路径总和超过 32 位','零权与循环移位方向'][trick]
        inp=f'1\n{len(a)}\n'+line(a);out=f'{loop(a)}\n'
    else:raise KeyError(letter)
    return inp,out,label

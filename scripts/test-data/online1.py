"""Independent exhaustive oracles for 2026 ICPC EC Online I."""
from collections import deque
from functools import lru_cache
from fractions import Fraction
from itertools import permutations, product, combinations
from math import factorial, gcd, lcm
from bisect import bisect_right
from liaoning import line
MOD=998244353

def recall(ops):
    @lru_cache(None)
    def dfs(i,stack):
        if i==len(ops):return ''
        op,x=ops[i]
        for pops in range(len(stack)+1):
            state=stack[:len(stack)-pops]
            if op=='+' and x in state:continue
            if op=='T' and x not in state:continue
            if op=='F' and x in state:continue
            answer=dfs(i+1,state+(x,) if op=='+' else state)
            if answer is not None:return '-'*pops+('+' if op=='+' else '?')+answer
        return None
    answer=dfs(0,());assert answer is not None;return answer+'\n'

def inversion(p):return sum(p[i]>p[j] for i in range(len(p)) for j in range(i+1,len(p)))
def permutation(n,constraints):
    ans=None;cost=10**9
    for p in permutations(range(1,n+1)):
        if all(all(p[a-1]<p[b-1] for a,b in zip(q,q[1:])) for l,r,q in constraints):
            v=inversion(p)
            if v<cost:cost=v;ans=p
    return '-1\n' if ans is None else line(ans)

@lru_cache(None)
def lcm_permutation(n):
    def dfs(path,remaining,value):
        if not remaining:return path if lcm(value,path[-1]+path[0])<=20*n else None
        for x in remaining:
            v=lcm(value,path[-1]+x)
            if v<=20*n:
                ans=dfs(path+(x,),tuple(y for y in remaining if y!=x),v)
                if ans:return ans
    ans=dfs((1,),tuple(range(2,n+1)),1);assert ans;return line(ans)

def mod_counts(a,v):
    out=[0]*(v+1)
    if a[0]==1:out[0]=factorial(len(a))%MOD
    elif min(a)>v:out[v]=factorial(len(a))%MOD
    else:
        for p in permutations(a):
            x=v
            for d in p:x%=d
            out[x]=(out[x]+1)%MOD
    return line(out)

def sequence(s):
    counts=[sum(x!=s[i] for x in s[:i+1]) for i in range(len(s))];return sorted(counts)
def sequence_count(a):
    if not any(a):return 2
    return sum(sequence(s)==sorted(a) for s in product('01',repeat=len(a)))%MOD

def routes(n,edges,costs,budget):
    graph=[[] for _ in range(n)]
    for u,v in edges:graph[u].append(v)
    dist=[-1]*n;dist[0]=0;q=deque([0])
    while q:
        v=q.popleft()
        for w in graph[v]:
            if dist[w]<0:dist[w]=dist[v]+1;q.append(w)
    if dist[-1]<0 or costs[0]>budget:return 0
    dp=[{} for _ in range(n)];dp[0][costs[0]]=1
    for v in sorted(range(n),key=lambda v:dist[v]):
        for w in graph[v]:
            if dist[w]!=dist[v]+1:continue
            for toll,count in dp[v].items():
                new=toll+costs[w]
                if new<=budget:dp[w][new]=(dp[w].get(new,0)+count)%(1<<64)
    return sum(dp[-1].values())%(1<<64)

def score(pattern,text):
    return sum(sum(text[:j].startswith(pattern[:i],k) for k in range(j-i+1))
        for i in range(1,len(pattern)+1) for j in range(1,len(text)+1))
def omega(x):
    count=0;p=2
    while p*p<=x:
        if x%p==0:
            count+=1
            while x%p==0:x//=p
        p+=1
    return count+(x>1)
def lamp(n,queries):
    if n>100:
        assert all(x in [1,2*10**18] for x in queries)
        return ''.join(f'1 {n}\n' if x==1 else f'{n} 1\n' for x in queries)
    points=sorted((Fraction(j,i),i,j) for i in range(1,n+1) for j in range(1,n+1));sums=[];total=0
    for slope,i,j in points:total+=omega(gcd(i,j))+1;sums.append(total)
    out=[]
    for value in queries:
        k=min(len(points)-1,bisect_right(sums,value)-1);assert k>=0;p=points[k][0];out.append(f'{p.numerator} {p.denominator}\n')
    return ''.join(out)

def string_ops(s,ops):
    state=list(s)
    for op,p,k in ops:
        seen={};done=0
        while done<k:
            key=''.join(state)
            if key in seen:
                cycle=done-seen[key];skip=(k-done)//cycle
                if skip:done+=skip*cycle;continue
            seen[key]=done;x=p-1;step=1 if op<=2 else -1;stop='N' if op%2 else 'H'
            while 0<=x<len(state):
                before=state[x];state[x]='H' if before=='N' else 'N'
                if before==stop:break
                x+=step
            done+=1
    return ''.join(state)+'\n'

def wolves(d,b):
    n=len(d)
    for a in product([0,1],repeat=n):
        if any(x and y for x,y in zip(a,a[1:])):continue
        if all(a[i] or sum(a[:i] if d[i]=='L' else a[i+1:])==b[i] for i in range(n)):
            return ''.join(map(str,a))+'\n'
    return '-1\n'

def lcp(strings):
    first=min(strings);last=max(strings);i=0
    while i<min(len(first),len(last)) and first[i]==last[i]:i+=1
    return i
def prefix_answers(strings):
    out=[]
    for i in range(1,len(strings)+1):
        out.append(sum(max(lcp(subset) for subset in combinations(strings[:i],j))^j for j in range(1,i+1)))
    return ''.join(f'{x}\n' for x in out)

def red(rows):
    dp=[0]*(len(rows)+1)
    for r in range(1,len(rows)+1):
        counts=[0,0,0]
        for l in range(r-1,-1,-1):
            counts=[counts[i]+rows[l][i] for i in range(3)]
            dp[r]=max(dp[r],dp[l]+(r-l if counts[0]>=max(counts[1:]) else 0))
    return dp[-1]

def make(letter,index,trick,rng):
    label=f'随机场景 {index+1}'
    if letter=='A':
        if trick is not None:
            ops=[[('+',1),('+',1),('T',1),('F',1)], [('+',2),('+',3),('T',2),('F',3),('T',2)], [('F',10**9),('+',10**9),('T',10**9)]][trick]
            label=['重复入栈必须插入弹栈','需要保留更深层元素','十亿元素与空栈询问'][trick]
        else:
            ops=[];state=[]
            for _ in range(rng.randint(1,18)):
                state=state[:rng.randint(0,len(state))];op=rng.choice(['+','T','F'])
                if op=='T' and not state:op='F'
                x=rng.choice(state) if op=='T' else rng.choice([x for x in range(1,12) if x not in state])
                ops.append((op,x))
                if op=='+':state.append(x)
        inp='1\n'+str(len(ops))+'\n'+''.join(f'{op} {x}\n' for op,x in ops);out=recall(ops)
    elif letter=='B':
        if trick==0:a=list(range(1,21));v=8;label='包含模数 1 与阶乘取模'
        elif trick==1:a=list(range(10,40));v=3;label='所有取模都不改变初值'
        elif trick==2:a=[7];v=7;label='模数恰好等于初值'
        else:a=sorted(rng.sample(range(1,35),rng.randint(1,7)));v=rng.randint(1,35)
        inp=f'{len(a)} {v}\n'+line(a);out=mod_counts(a,v)
    elif letter=='C':
        n=4 if trick is not None else rng.randint(1,7);cs=[]
        if trick==0:cs=[(1,n,list(range(1,n+1))),(1,n,list(range(n,0,-1)))];label='互相矛盾的约束'
        elif trick==1:cs=[(2,4,[4,2,3])]*2;label='重复约束与最少逆序对'
        elif trick==2:cs=[(1,1,[1]),(1,4,[2,1,4,3])];label='单点区间没有额外限制'
        else:
            p=list(range(1,n+1));rng.shuffle(p)
            for _ in range(rng.randint(1,4)):
                l=rng.randint(1,n);r=rng.randint(l,n);q=sorted(range(l,r+1),key=lambda i:p[i-1]);cs.append((l,r,q))
        inp='1\n'+f'{n} {len(cs)}\n'+''.join(line([l,r]+q) for l,r,q in cs);out=permutation(n,cs)
    elif letter=='D':
        if trick==0:a=[0]*100000;label='十万个零的多重集'
        else:
            s=['00110011','01010101'][trick-1] if trick is not None else ''.join(rng.choice('01') for _ in range(rng.randint(1,13)))
            a=sequence(s);rng.shuffle(a)
            if trick is not None:label=['多重集顺序不能当作原序列','对称翻转与交替序列'][trick-1]
        inp=str(len(a))+'\n'+line(a);out=f'{sequence_count(a)}\n'
    elif letter=='E':
        ns=[[1],[8],[9]][trick] if trick is not None else [rng.randint(1,9) for _ in range(rng.randint(2,4))]
        if trick is not None:label=['单元素首尾相邻自身','偶数环的最小公倍数','奇数环的最小公倍数'][trick]
        inp=str(len(ns))+'\n'+''.join(f'{n}\n' for n in ns);out=''.join(lcm_permutation(n) for n in ns)
    elif letter=='F':
        if trick==0:a=[[-5,-5]]*8;label='相等年份不算更优秀'
        elif trick==1:a=[[-i]*13 for i in range(1,51)];label='50 年连续严格下降'
        elif trick==2:a=[[-1000]*13,[-1]*13,[-1000]*13];label='负数与第一年和零比较'
        else:a=[]
        # Keep the number of columns constant within one input file.
        if trick is None:m=rng.randint(1,13);a=[[rng.randint(-1000,-1) for _ in range(m)] for _ in range(rng.randint(1,20))]
        scores=[0]+[sum(row) for row in a];inp=f'{len(a)} {len(a[0])}\n'+''.join(line(row) for row in a);out=f'{sum(x<y for y,x in zip(scores,scores[1:]))}\n'
    elif letter=='G':
        if trick==0:n=1;edges=[];costs=[9];budget=8;label='起终点同城仍需缴费'
        elif trick==1:n=5;edges=[(0,1),(1,0),(2,4)];costs=[0]*n;budget=0;label='终点不可达'
        elif trick==2:
            layers=35;n=layers*2+2;costs=[0]*n;budget=0;edges=[(0,1),(0,2)]
            for layer in range(layers-1):edges += [(1+2*layer+i,3+2*layer+j) for i in range(2) for j in range(2)]
            edges += [(n-3,n-1),(n-2,n-1)];label='最短路径数超过 32 位'
        else:
            n=rng.randint(1,8);edges=rng.sample([(i,j) for i in range(n) for j in range(n) if i!=j],rng.randint(0,min(15,n*(n-1))));costs=[rng.randint(0,10) for _ in range(n)];budget=rng.randint(0,40)
        inp=f'{n} {len(edges)} {budget}\n'+line(costs)+''.join(f'{u+1} {v+1}\n' for u,v in edges);out=f'{routes(n,edges,costs,budget)}\n'
    elif letter=='H':
        if trick==0:text='aaaaa';queries=[(['a','aa','aaa'],1),(['aaa'],15)];label='重叠匹配计数'
        elif trick==1:text='abc';queries=[(['x'],1),(['a'],10**18)];label='不可能满足的大阈值'
        elif trick==2:text='aba';queries=[(['a','a'],2),(['aba'],score('aba','aba'))];label='重复模式与恰好达到阈值'
        else:text=''.join(rng.choice('abc') for _ in range(rng.randint(1,20)));queries=[([''.join(rng.choice('abc') for _ in range(rng.randint(1,5))) for _ in range(rng.randint(1,3))],rng.randint(1,100)) for _ in range(6)]
        inp=text+'\n'+str(len(queries))+'\n'+''.join(f'{len(a)} {b}\n'+'\n'.join(a)+'\n' for a,b in queries)
        out=''.join(f'{next((x for x in range(1,len(text)+1) if sum(score(s,text[:x]) for s in a)>=b),-1)}\n' for a,b in queries)
    elif letter=='I':
        if trick==0:n=10**9;queries=[1,2*10**18];label='十亿网格首尾极值'
        elif trick==1:n=1;queries=[1,2*10**18];label='只有一颗星'
        elif trick==2:n=4;queries=[3,4,5,10,11];label='相同斜率按距离排序'
        else:n=rng.randint(1,18);queries=[rng.randint(1,n*n*2) for _ in range(5)]
        inp=f'{n} {len(queries)}\n'+''.join(f'{x}\n' for x in queries);out=lamp(n,queries)
    elif letter=='J':
        if trick==0:s='HNNH';ops=[(1,4,0),(4,1,0)];label='重复次数为零'
        elif trick==1:s='NHNHNH';ops=[(1,1,10**18),(4,6,10**18-1)];label='十的十八次方重复'
        elif trick==2:s='NNNN';ops=[(3,1,3),(2,4,2)];label='边界结束与先翻转再判断'
        else:s=''.join(rng.choice('NH') for _ in range(rng.randint(1,10)));ops=[(rng.randint(1,4),rng.randint(1,len(s)),rng.randint(0,20)) for _ in range(rng.randint(1,12))]
        inp=f'{len(s)} {len(ops)}\n'+s+'\n'+''.join(line(op) for op in ops);out=string_ops(s,ops)
    elif letter=='K':
        if trick==0:d='LL';b=[1,1];label='相邻位置不能都是狼人'
        elif trick==1:d='RL';b=[1,0];label='狼人也可以说真话'
        elif trick==2:d='LRLRLR';b=[0,2,1,1,2,0];label='左右人数不包括本人'
        else:d=''.join(rng.choice('LR') for _ in range(rng.randint(2,10)));b=[rng.randint(0,len(d)) for _ in d]
        inp=f'1\n{len(d)}\n{d}\n'+line(b);out=wolves(d,b)
    elif letter=='L':
        strings=[['abc']*9,['a','ab','abc','abcd','abcde'],['a','b','c','d']][trick] if trick is not None else [''.join(rng.choice('abc') for _ in range(rng.randint(1,7))) for _ in range(rng.randint(1,9))]
        if trick is not None:label=['所有字符串相同','前缀嵌套','公共前缀为零'][trick]
        inp=str(len(strings))+'\n'+'\n'.join(strings)+'\n';out=prefix_answers(strings)
    elif letter=='M':
        if trick==0:names=['A','a'];queries=['A','a','A','a','AA'];label='队名大小写敏感'
        elif trick==1:names=['Team'];queries=['Wrong']*8+['Team','Team'];label='不存在的队名一直 WRONG'
        elif trick==2:names=['a'*1000,'a'*999+'b'];queries=names+names;label='很长且公共前缀相同的队名'
        else:
            names=sorted(set(''.join(rng.choice('aAbB') for _ in range(rng.randint(1,6))) for _ in range(10)));queries=[rng.choice(names+['Z','ZZ']) for _ in range(20)]
        seen=set();ans=[]
        for x in queries:
            ans.append('WRONG' if x not in names else 'REPEAT' if x in seen else 'OK')
            if x in names:seen.add(x)
        inp=f'{len(names)} {len(queries)}\n'+'\n'.join(names+queries)+'\n';out='\n'.join(ans)+'\n'
    elif letter=='N':
        rows=[[(0,1,1)]*20,[(1,1,1)]*20,[(1,0,0)]*3+[(0,1,1)]*5+[(1,0,0)]*3][trick] if trick is not None else [rng.choice(list(product([0,1],repeat=3))[1:]) for _ in range(rng.randint(1,25))]
        if trick is not None:label=['不存在红棋子的段','计数相等也算红段','局部好段和整体最优不同'][trick]
        inp=str(len(rows))+'\n'+''.join(line(row) for row in rows);out=f'{red(rows)}\n'
    else:raise KeyError(letter)
    return inp,out,label

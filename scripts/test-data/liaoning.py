"""Small exhaustive/simulation oracles for the 2025 Liaoning problems.

Large special cases use stated closed forms, never another contestant's output.
"""
from collections import deque
from functools import lru_cache
from itertools import product, combinations
from math import comb
import heapq

MOD=998244353
def line(a): return ' '.join(map(str,a))+'\n'
def one_array(a): return '1\n'+str(len(a))+'\n'+line(a)

def gulls(birds,food):
    moves=[('U',-1,0),('D',1,0),('L',0,-1),('R',0,1)]
    @lru_cache(None)
    def dfs(ids,foods):
        if not ids:return ()
        occupied={birds[i] for i in ids};left=set(foods)
        for i in ids:
            for d,dr,dc in moves:
                r,c=birds[i];r+=dr;c+=dc
                while (r,c) in occupied:r+=dr;c+=dc
                if (r,c) in left:
                    answer=dfs(tuple(j for j in ids if j!=i),tuple(sorted(left-{(r,c)})))
                    if answer is not None:return ((i+1,d),)+answer
        return None
    path=dfs(tuple(range(len(birds))),tuple(sorted(food)))
    return 'No\n' if path is None else 'Yes\n'+''.join(f'{i} {d}\n' for i,d in path)

def keyboard(m,banned):
    digits=[x for x in range(10) if x not in banned]
    q=deque();paths={}
    for d in digits:
        if d and d%m not in paths:paths[d%m]=str(d);q.append(d%m)
    while q:
        r=q.popleft()
        if r==0:
            blocks=[]
            for x in paths[r]:
                if blocks and blocks[-1][0]==x:blocks[-1][1]+=1
                else:blocks.append([x,1])
            assert len(blocks)<=100
            return str(len(blocks))+'\n'+''.join(f'{d} {n}\n' for d,n in blocks)
        for d in digits:
            nr=(r*10+d)%m
            if nr not in paths:paths[nr]=paths[r]+str(d);q.append(nr)
    return '-1\n'

def entering(a):
    if len(a)>1000:
        assert set(a)=={1};return len(a)*(len(a)+1)//2
    total=0
    for i in range(len(a)):
        s=d=0
        for x in a[i:]:
            s+=x;d=max(d,max(map(int,str(x))));total+=s%d==0
    return total

@lru_cache(None)
def game(a):
    a=tuple(x for x in a if x)
    if not a:return False
    if len(a)==1:return bool(a[0]%2)
    n=len(a)
    for p in range(n+1):
        for s in range(n-p+1):
            if p+s and not game(tuple(x-(i<p or i>=n-s) for i,x in enumerate(a))):return True
    return False

def stars(a):
    n=len(a)
    if min(a)==max(a)==1:return pow(n,n-2,MOD)
    if min(a)==n:return 0
    count=0
    for seq in product(range(n),repeat=n-2):
        degree=[1+seq.count(i) for i in range(n)];leaves=degree.count(1);mx=max(degree)
        count+=all(a[i]<=leaves for i in range(n) if degree[i]==mx)
    return count%MOD

def cards(a):
    if len(a)==1:return a[0]
    if len(a)==2:return max(a[0],(sum(a)+1)//2)
    @lru_cache(None)
    def solve(state):
        best=state[0]
        for i in range(1,len(state)):
            if state[i]>state[0]:
                b=list(state);b[0]+=1;b[i]-=1;best=max(best,solve(tuple(b)))
        return best
    return solve(tuple(a))

def kanon(s):
    n=len(s);best=[-1]*(n+1);ways=[0]*(n+1)
    if set(s)=={'0'}:
        best=[0]*(n+1);ways=[0]+[comb(n-1,k-1)%MOD for k in range(1,n+1)]
    else:
        for mask in range(1<<(n-1)):
            cuts=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n];v=0
            for l,r in zip(cuts,cuts[1:]):v^=int(s[l:r],2)
            k=len(cuts)-1
            if v>best[k]:best[k]=v;ways[k]=1
            elif v==best[k]:ways[k]+=1
    out=[0]*4
    for k in range(1,n+1):
        p,q=best[k]%MOD,ways[k]%MOD
        out[0]^=p;out[1]^=q;out[2]^=p*k;out[3]^=q*k
    return line(out)

def capoo(pairs):
    n=len(pairs);dp={0:0};ans=0
    for mask in range(1<<n):
        if mask not in dp:continue
        x=dp[mask];ans=max(ans,mask.bit_count())
        for i,(a,b) in enumerate(pairs):
            if not mask>>i&1 and x<=a:
                new=mask|(1<<i);dp[new]=min(dp.get(new,10**30),max(x,b))
    return ans

def make(letter,index,trick,rng):
    label=f'随机场景 {index+1}'
    if letter=='A':
        if trick==0:birds=[(2,2),(2,3)];food=[(2,4),(1,3)];label='先后顺序影响跳跃'
        elif trick==1:birds=[(1,1)];food=[(5000,5000)];label='单只海鸥无解'
        elif trick==2:birds=[(5000,5000),(4999,4999)];food=[(5000,4999),(4999,5000)];label='最大坐标边界'
        else:
            n=rng.randint(1,5);points=rng.sample(list(product(range(1,6),repeat=2)),2*n);birds=points[:n];food=points[n:]
        inp='1\n'+str(len(birds))+'\n'+''.join(line(p) for p in birds+food);out=gulls(birds,food)
    elif letter=='B':
        if trick==0:m=97;banned=list(range(2,10));label='只剩 0 和 1'
        elif trick==1:m=7;banned=list(range(1,10));label='只剩 0，正整数不存在'
        elif trick==2:
            m=10**7;banned=list(range(2,10));label='最大模数与连续零'
        else:m=rng.randint(1,97);banned=rng.sample(range(1,10),rng.randint(0,9))
        inp='1\n'+f'{m} {len(banned)}\n'+line(banned)
        out='2\n1 1\n0 7\n' if m==10**7 else keyboard(m,banned)
    elif letter=='C':
        a,b=[(100,100),(999,998),(998,999)][trick] if trick is not None else (rng.randint(100,999),rng.randint(100,999))
        if trick is not None:label=['恰好够用','少 1 克','多 1 克'][trick]
        inp=f'{a}g {b}g\n';out=f'{int(b>=a)}\n'
    elif letter=='D':
        options=[[(1,1,0),(0,1,1),(1,0,1)],[(1,0,0),(0,1,0),(0,0,1)],[(0,1,0)]*100]
        a=options[trick] if trick is not None else [rng.choice(list(product([0,1],repeat=3))[1:]) for _ in range(rng.randint(1,15))]
        if trick is not None:label=['两两相交无公共材质','必须使用三种材质','100 个相同机关'][trick]
        out=f'{min(mask.bit_count() for mask in range(1,8) if all(any(mask>>i&1 and row[i] for i in range(3)) for row in a))}\n'
        inp=str(len(a))+'\n'+''.join(line(x) for x in a)
    elif letter=='E':
        a=([11,12,21,81,1000000000],[1]*100000,[9,19,90,99,999999999])[trick] if trick is not None else [rng.randint(1,99999) for _ in range(rng.randint(1,30))]
        if trick is not None:label=['最大数字与最大数不同','答案超过 32 位','数字 9 的整除边界'][trick]
        inp=one_array(a);out=f'{entering(a)}\n'
    elif letter=='F':
        if trick==0:a=[2];n,p,s=5,0,0;label='单堆偶数必败'
        elif trick==1:a=[1000000000];n,p,s=3,1,0;label='大石子数单堆边界'
        elif trick==2:a=[1,2,1];n,p,s=3,1,1;label='前后缀与中间堆'
        else:
            a=[rng.randint(1,3) for _ in range(rng.randint(1,3))];n=rng.randint(1,3);p=rng.randint(0,len(a));s=rng.randint(0,len(a)-p)
        inp='1\n'+f'{n} {len(a)} {p} {s}\n'+line(a);answers=[]
        for _ in range(n):
            answers.append('Alice' if game(tuple(a)) else 'Bob')
            a=[sum(a[j:p]) if j<p else sum(a[len(a)-s:j+1]) if j>=len(a)-s else x for j,x in enumerate(a)]
        out='\n'.join(answers)+'\n'
    elif letter=='G':
        if trick is not None:a=([1]*250,[250]*250,[1,3,1,3])[trick]
        else:n=rng.randint(3,7);a=[rng.randint(1,n) for _ in range(n)]
        if trick is not None:label=['250 点 Cayley 计数','没有合法树','最大度数并列取最大权值'][trick]
        inp=one_array(a);out=f'{stars(a)}\n'
    elif letter=='H':
        n=1 if trick==0 else rng.randint(3,12);parents=[-1]+[rng.randrange(i) for i in range(1,n)];weights=[0]+[rng.randint(1,100) for _ in range(1,n)];work=[0]*n
        children=[[] for _ in range(n)]
        for i in range(1,n):children[parents[i]].append(i)
        def subtree(i):return [i]+[v for j in children[i] for v in subtree(j)]
        graph=[[] for _ in range(n)]
        for i in range(1,n):graph[i].append((parents[i],weights[i]));graph[parents[i]].append((i,weights[i]))
        def distance(x,y):
            def dfs(v,p,d):
                if v==y:return d
                for w,c in graph[v]:
                    if w!=p:
                        r=dfs(w,v,d+c)
                        if r is not None:return r
            return dfs(x,-1,0)
        ops=[];ans=[]
        for k in range(20):
            x=0 if trick==1 else rng.randrange(n)
            if k%3==0:ops.append(f'2 {x+1}');ans.append(sum(work[v] for v in subtree(x)))
            else:
                y=x if trick==2 else rng.randrange(n);ops.append(f'1 {x+1} {y+1}')
                for v in subtree(x):work[v]+=distance(v,y)
        if trick is not None:label=['单城市距离为零','根节点覆盖整棵树','任务目的地在子树内'][trick]
        inp=f'{n} {len(ops)}\n'+''.join(f'{parents[i]+1} {weights[i]}\n' for i in range(1,n))+'\n'.join(ops)+'\n';out=''.join(f'{x}\n' for x in ans)
    elif letter=='I':
        a=([0],[1000000000,0],[0,1000000000])[trick] if trick is not None else [rng.randint(0,10) for _ in range(rng.randint(1,5))]
        if trick is not None:label=['没有其他角色','自己最富无需取牌','十亿张卡牌'][trick]
        inp=one_array(a);out=f'{cards(a)}\n'
    elif letter=='J':
        n=1 if trick==0 else rng.randint(2,6);groups=[[] for _ in range(n)];ops=[];student=100000000
        for k in range(25):
            active=[i for i,a in enumerate(groups) if a]
            if len(active)>=2 and (trick==1 or rng.random()<.4):
                a,b=rng.sample(active,2);x=rng.randrange(len(groups[a]));y=rng.randrange(len(groups[b]));groups[a][x],groups[b][y]=groups[b][y],groups[a][x];ops.append(f'2 {a+1} {x+1} {b+1} {y+1}')
            else:
                i=0 if trick==2 else rng.randrange(n);groups[i].append(student);ops.append(f'1 {i+1} {student}');student+=1
        if trick is not None:label=['只有一个实验','多次交换后又交换','空实验仍须输出'][trick]
        inp=f'{n} {len(ops)}\n'+'\n'.join(ops)+'\n';out=''.join(line([len(a)]+a) for a in groups)
    elif letter=='K':
        s=['0'*40,'000101','1111111111'][trick] if trick is not None else ''.join(rng.choice('01') for _ in range(rng.randint(1,10)))
        if trick is not None:label=['全零与组合计数取模','前导零参与划分','全一异或抵消'][trick]
        inp='1\n'+s+'\n';out=kanon(s)
    elif letter=='L':
        n=[1,12,15][trick] if trick is not None else rng.randint(1,10);r=list(range(1,n+1));c=r.copy();rng.shuffle(r);rng.shuffle(c)
        if trick==1:r.sort();c.sort(reverse=True)
        if trick==2:c=r.copy()
        if trick is not None:label=['1×1 矩阵','行列排列方向相反','行列排列完全相同'][trick]
        inp='1\n'+str(n)+'\n'+line(r)+line(c);out=''.join(line([min(x,y)-1 for y in c]) for x in r)
    elif letter=='M':
        pairs=[[(0,10**18),(10**18,0),(10**18,10**18)],[(0,5),(0,1),(0,0)],[(2,3),(3,2),(0,1),(1,4)]][trick] if trick is not None else [(rng.randint(0,15),rng.randint(0,15)) for _ in range(rng.randint(1,10))]
        if trick is not None:label=['64 位难度和隐藏分','难度相同仍需选择顺序','形成互相限制的比赛'][trick]
        inp=str(len(pairs))+'\n'+''.join(line(p) for p in pairs);out=f'{capoo(pairs)}\n'
    else:raise KeyError(letter)
    return inp,out,label

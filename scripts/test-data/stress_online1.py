"""Large files and independently provable adversarial families for Online I."""
import math,functools,itertools,sys
import online1 as small
from liaoning import line,MOD
from stress_common import native,scaled,factorial_mod

@functools.lru_cache(None)
def cycle(n):
    # An offline Hamiltonian witness search; the public checker certifies every
    # adjacent sum. We use successful sizes, never assume a greedy path exists.
    if n<=13:return tuple(map(int,small.lcm_permutation(n).split()))
    L=168
    while n>25*(L//168):L*=2
    divisors=[d for d in range(1,min(2*n,L)+1) if L%d==0]
    g=[[]]+[[d-v for d in divisors if 1<=d-v<=n and d-v!=v] for v in range(1,n+1)]
    used=[False]*(n+1);used[1]=True;p=[1];calls=0
    def dfs(v):
        nonlocal calls
        calls+=1
        if calls>1000000:return False
        if len(p)==n:return p[-1]==2
        choices=[w for w in g[v] if not used[w] and (w!=2 or len(p)==n-1)]
        choices.sort(key=lambda w:sum(not used[z] for z in g[w]))
        for w in choices:
            p.append(w);used[w]=True
            if dfs(w):return True
            p.pop();used[w]=False
        return False
    assert dfs(1),n
    assert math.lcm(*(p[i]+p[(i+1)%n] for i in range(n)))<=20*n
    return tuple(p)

def xor_sum(x,n):
    return sum((n-((n+1)//(2*b)*b+max(0,(n+1)%(2*b)-b)) if x&b else
                (n+1)//(2*b)*b+max(0,(n+1)%(2*b)-b))*b for b in [1<<i for i in range(max(x,n).bit_length()+1)])
def apply_big(s,ops):
    n=len(s);value=int(s.replace('N','0').replace('H','1')[::-1],2);mask=(1<<n)-1;reverse=False
    for op,p,k in ops:
        backwards=op>=3
        if backwards!=reverse:
            value=int(format(value,f'0{n}b')[::-1],2);reverse=backwards
        pos=n-p if backwards else p-1
        value=(value+(k<<pos)*(1 if op%2 else -1))&mask
    if reverse:value=int(format(value,f'0{n}b')[::-1],2)
    return format(value,f'0{n}b')[::-1].replace('0','N').replace('1','H')+'\n'

def make(letter,index,trick,rng):
    if trick is not None:return small.make(letter,index,trick,rng)
    i=index;label=f'压力数据 {i+1}'
    if letter=='A':
        n=scaled(i,1000000);ops=[];witness=[];stack=[];present=set();nextid=1
        for j in range(n):
            if stack and j%7==0:
                count=min(len(stack),rng.randrange(1,8));witness.append('-'*count)
                for _ in range(count):present.remove(stack.pop())
            if not stack or j%3==0:
                x=nextid if i%2 else 10**9-nextid;nextid+=1
                if j%11==0 and stack:
                    x=stack[-1];present.remove(stack.pop());witness.append('-')
                ops.append(f'+ {x}\n');stack.append(x);present.add(x);witness.append('+')
            elif j%3==1:ops.append(f'T {rng.choice(stack)}\n');witness.append('?')
            else:ops.append(f'F {10**9 if i%2 else 1}\n');witness.append('?')
        inp='1\n'+str(n)+'\n'+''.join(ops);out=''.join(witness)+'\n';label='百万操作、重复压栈与保留深层元素'
    elif letter=='B':
        v=[500,3000,10000,50000,120000,200000,262143,180000,90000,262142,250000,262143][i]
        if i==6:a=list(range(1,262144))
        else:
            k=5+i%4;active=sorted(rng.sample(range(2,min(v,900)),k))
            available=list(range(v+1,262144));n=min(len(available)+k,scaled(i,200000));rng.shuffle(available)
            a=sorted(active+available[:n-k])
            if not available:a=active
        ans=[0]*(v+1);factor=factorial_mod(len(a))
        if a[0]==1:ans[0]=factor
        else:
            effective=[d for d in a if d<=v]
            for p in itertools.permutations(effective):
                x=v
                for d in p:x%=d
                ans[x]+=1
            multiple=factor*pow(math.factorial(len(effective)),MOD-2,MOD)%MOD
            ans=[x*multiple%MOD for x in ans]
        inp=f'{len(a)} {v}\n'+line(a);out=line(ans);label='大值域、阶乘与有效模数顺序分布'
    elif letter=='C':
        n=scaled(i,1000000);q=list(range(1,n+1));rng.shuffle(q)
        if i%3==0:
            constraints=[(1,n,q)];p=[0]*n
            for rank,pos in enumerate(q,1):p[pos-1]=rank
            out=line(p)
        elif i%3==1:
            constraints=[(1,n,q),(min(q[0],q[1]),max(q[0],q[1]),list(range(min(q[0],q[1]),max(q[0],q[1])+1)))]
            # Full reverse is always contradictory, with total permutation
            # lengths bounded by 10^6 across constraints.
            n=min(n,500000);q=list(range(n,0,-1));constraints=[(1,n,q),(1,n,list(range(1,n+1)))];out='-1\n'
        else:
            constraints=[];p=list(range(1,n+1));width=37+i*13
            for l in range(1,n+1,width):
                r=min(n,l+width-1);q=list(range(l,r+1));rng.shuffle(q);constraints.append((l,r,q))
                for rank,pos in enumerate(q,l):p[pos-1]=rank
            out=line(p)
        inp=f'1\n{n} {len(constraints)}\n'+''.join(line([l,r]+q) for l,r,q in constraints);label='百万排列、重复 / 矛盾约束与最小逆序'
    elif letter=='D':
        n=scaled(i,100000)-(1 if i==8 else 0)
        if i%4==0:a=[0]*n;ans=2
        elif i%4==1:a=[0]+[x for k in range(1,n//2) for x in (k,k)]+([n//2] if n%2==0 else [n//2,n//2]);ans=pow(2,(n+1)//2,MOD)
        elif i%4==2:
            r=n//3+2;a=[0]*r+[r]*(n-r);ans=2 if 2*r>=n else 4
        else:a=[0]*(n-1)+[n-1];ans=2
        rng.shuffle(a);inp=str(n)+'\n'+line(a);out=f'{ans}\n';label='十万计数、多重集乱序与指数级方案数'
    elif letter=='E':
        sys.setrecursionlimit(10000)
        sizes=[14,15,16,24,26,27,32,64,256,512]
        # Aggregate maximum case count and millions of output elements. The
        # independent checker permits any construction, not just these witnesses.
        T=[100,300,500,1000,2000,3000,4000,5000,6000,8000,9999,10000][i]
        ns=[rng.choice(sizes[-min(3+i//3,len(sizes)):]) for _ in range(T)]
        if i>=4:ns=[512 if rng.random()<.85 else rng.choice(sizes) for _ in range(T)]
        if i==11:ns=[512]*T
        inp=str(T)+'\n'+''.join(f'{n}\n' for n in ns);out=''.join(line(cycle(n)) for n in ns);label='万组构造、奇偶环与数百万排列输出'
    elif letter=='F':
        n=50;m=13;a=[[rng.randint(-1000,-1) for _ in range(m)] for _ in range(n)]
        if i%3==0:
            for j in range(1,n,2):a[j]=a[j-1].copy()
        if i%3==1:a.sort(key=sum)
        sums=[0]+[sum(x) for x in a];inp=f'{n} {m}\n'+''.join(line(x) for x in a);out=f'{sum(x<y for y,x in zip(sums,sums[1:]))}\n';label='完整五十年、负分、平分与排序误用'
    elif letter=='G':
        layers=44;n=2*layers+2;edges=[(0,1),(0,2)];cost=[0]*n
        p=38 if i%3==0 else 32+i%6;high=layers-p
        for j in range(layers):cost[2*j+2]=1<<min(j,p)
        for j in range(layers-1):edges += [(1+2*j+a,3+2*j+b) for a in range(2) for b in range(2)]
        edges += [(n-3,n-1),(n-2,n-1)]
        candidates=[(u,v) for u in range(1,n-1) for v in range(u) if (u,v) not in edges];rng.shuffle(candidates);edges += candidates[:300-len(edges)]
        budget=rng.randrange(1,10**12+1)
        if i%4==1:budget=(1<<p)-1
        ans=sum(math.comb(high,k)*min(1<<p,max(0,budget-k*(1<<p)+1)) for k in range(high+1))%(1<<64)
        inp=f'{n} {len(edges)} {budget}\n'+line(cost)+''.join(f'{u+1} {v+1}\n' for u,v in edges);out=f'{ans}\n';label='44 层指数路径、二进制费用与大预算临界值'
    elif letter=='H':
        from bisect import bisect_left
        n=scaled(i,200000);q=min(200000,n)
        if i%3==2:
            text='a'*n;budget=200000;queries=[];answers=[]
            def score(x,length):
                t=min(x,length)
                return (x*(x+1)*(x+2)-(x-t)*(x-t+1)*(x-t+2))//6
            while budget:
                patterns=[];lengths=[]
                for _ in range(min(rng.randint(1,3),budget)):
                    length=rng.randint(1,min(100,budget));valid=length-(rng.randrange(4)==0)
                    patterns.append('a'*valid+('b' if valid<length else ''));lengths.append(valid);budget-=length
                    if not budget:break
                x=rng.randrange(1,n+1);value=sum(score(x,length) for length in lengths)
                b=rng.choice([max(1,value),max(1,value+1),1,10**18]);queries.append(f'{len(patterns)} {b}\n'+'\n'.join(patterns)+'\n')
                if sum(score(n,length) for length in lengths)<b:answers.append(-1);continue
                l,r=1,n
                while l<r:
                    mid=(l+r)//2
                    if sum(score(mid,length) for length in lengths)>=b:r=mid
                    else:l=mid+1
                answers.append(l)
            inp=text+'\n'+str(len(queries))+'\n'+''.join(queries);out=''.join(f'{v}\n' for v in answers)
            return inp,out,'长模式、重复前缀与重叠累计临界值'
        text=''.join(rng.choice('abc') for _ in range(n)) if i%2 else 'a'*n
        sums={}
        for c in 'abcz':
            count=total=0;a=[]
            for ch in text:count+=ch==c;total+=count;a.append(total)
            sums[c]=a
        queries=[];ans=[]
        for j in range(q):
            c=rng.choice('abcz');b=rng.choice([1,10**18,rng.randint(1,n*(n+1)//2),sums[c][rng.randrange(n)] or 1])
            queries.append(f'1 {b}\n{c}\n');k=bisect_left(sums[c],b);ans.append(k+1 if k<n else -1)
        inp=text+'\n'+str(q)+'\n'+''.join(queries);out=''.join(f'{x}\n' for x in ans);label='20 万文本和询问、重叠累计与阈值边界'
    elif letter=='I':
        if i<6:
            n=[70,100,140,180,230,300][i];queries=[rng.randrange(1,n*n*2),1,n*n,2*10**18,rng.randrange(1,n*n)]
            # Exact rational sorting remains an independent oracle at this scale.
            from fractions import Fraction
            from bisect import bisect_right
            points=sorted((Fraction(j,k),k,j) for k in range(1,n+1) for j in range(1,n+1));acc=[];v=0
            for f,k,j in points:v+=small.omega(math.gcd(k,j))+1;acc.append(v)
            out=''.join(f'{points[max(0,min(len(points)-1,bisect_right(acc,b)-1))][0].numerator} {points[max(0,min(len(points)-1,bisect_right(acc,b)-1))][0].denominator}\n' for b in queries)
        else:
            n=10**9-(i-6)*3571;queries=[1,n//2,rng.randint(2,n//2),2*10**18,n//2-1]
            out=''.join(f'1 {n-b+1}\n' if b<=n//2 else f'{n} 1\n' for b in queries)
        inp=f'{n} {len(queries)}\n'+''.join(f'{b}\n' for b in queries);label='大网格、精确分数排序与同斜率权重'
    elif letter=='J':
        n=scaled(i,100000);q=n;s=''.join(rng.choice('NH') for _ in range(n));ops=[]
        for j in range(q):
            direction=(j//1000)%2;op=1+rng.randrange(2)+2*direction;p=rng.choice([1,n,rng.randint(1,n)]);k=rng.choice([0,1,2,10**18,10**18-1,rng.randrange(10**18)])
            ops.append((op,p,k))
        inp=f'{n} {q}\n'+s+'\n'+''.join(line(op) for op in ops);out=apply_big(s,ops);label='十万翻转、双向进位与 10^18 次重复'
    elif letter=='K':
        n=scaled(i,500000);p=[0]*n
        for j in range(n):
            if not (j and p[j-1]):p[j]=int(rng.random()<(.12 if i%2 else .48))
        prefix=[0]
        for v in p:prefix.append(prefix[-1]+v)
        d=''.join(rng.choice('LR') for _ in range(n));b=[prefix[j] if d[j]=='L' else prefix[n]-prefix[j+1] for j in range(n)]
        for j in range(n):
            if p[j] and j%5==0:b[j]=rng.randrange(n+1)
        inp=f'1\n{n}\n{d}\n'+line(b);out=''.join(map(str,p))+'\n';label='50 万位置、稀疏 / 密集狼人及双向人数'
    elif letter=='L':
        if i%2:
            target=500000;strings=[]
            if i==11:
                strings=['a'*500000]
            else:
                pool=[''.join(rng.choice('abc') for _ in range(rng.randint(5,200))) for _ in range(100)]
                while target:
                    word=rng.choice(pool) if rng.random()<.4 else rng.choice(pool)[:rng.randint(1,100)]+'\u0061'*rng.randint(0,20)
                    word=word[:target];strings.append(word);target-=len(word)
            inp=str(len(strings))+'\n'+'\n'.join(strings)+'\n';out=native('prefixes',inp)
            return inp,out,'随机长前缀、嵌套 / 重复与深达五十万的 trie'
        length=[1,2,4,8,16,32,64,128,250,500,1,1][i];n=min(500000//length,scaled(i,500000));prefix=''.join(rng.choice('abc') for _ in range(length-1));strings=[];counts=[0]*26;mx=0;out=[]
        base=[0];delta=[0]
        for j in range(1,n+1):base.append(base[-1]+((length-1)^j));delta.append(delta[-1]+(length^j)-((length-1)^j))
        for j in range(n):
            c=rng.randrange(26 if i%2 else 3);strings.append(prefix+chr(97+c));counts[c]+=1;mx=max(mx,counts[c]);out.append(base[j+1]+delta[mx])
        inp=str(n)+'\n'+'\n'.join(strings)+'\n';out=''.join(f'{x}\n' for x in out);label='50 万字符、重复长前缀与在线最大组计数'
    elif letter=='M':
        n=scaled(i,100000);m=min(100000,2*n)
        def letters(j):
            out=[]
            for _ in range(4):out.append(chr(97+j%26));j//=26
            return ''.join(out)
        names=[('T' if j%2 else 't')+letters(j) for j in range(n)];registered=set(names);queries=[];seen=set();ans=[]
        for j in range(m):
            name=rng.choice(names) if j%7 else 'X'+letters(j);queries.append(name);ans.append('WRONG' if name not in registered else 'REPEAT' if name in seen else 'OK')
            if name in registered:seen.add(name)
        # Keep the statement's total name length <= 10^6.
        inp=f'{n} {m}\n'+'\n'.join(names+queries)+'\n';out='\n'.join(ans)+'\n';label='大量大小写敏感队名、重复与未注册查询'
    elif letter=='N':
        n=scaled(i,1000000);rows=[rng.choice([(1,0,0),(0,1,0),(0,0,1),(1,1,0),(1,0,1),(0,1,1),(1,1,1)]) for _ in range(n)]
        if i%3==0:rows=[rng.choice([(1,0,0),(0,1,1)]) for _ in range(n)]
        inp=str(n)+'\n'+''.join(line(x) for x in rows);out=native('red',inp);label='百万行、二维前缀支配与局部贪心反例'
    else:raise KeyError(letter)
    return inp,out,label

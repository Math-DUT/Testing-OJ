"""Full-scale Online II inputs with independent geometric and DP references."""
import math
import online2 as small
from liaoning import line,one_array
from stress_common import native,scaled

def make(letter,index,trick,rng):
    if trick is not None:return small.make(letter,index,trick,rng)
    i=index;label=f'压力数据 {i+1}'
    if letter=='A':
        m=16+i%5;universe=1<<m
        if i%3==0:
            # Each already-closed one-dimensional space constrains any common
            # addition. The final nonclosed pair forces the entire universe.
            n=min(200000,scaled(i,200000));sets=[[0,1<<(j%m)] for j in range(n-1)]+[[1,2]]
            inp=f'{n} {m}\n'+''.join(line([len(s)]+s) for s in sets);added=list(range(universe))
        elif i%3==1:
            count=min(1000000,universe-1);s=rng.sample(range(universe),count)
            # Dense set (> half a subspace) has full rank. For smaller m we
            # remove one element, still ensuring the only completion is full.
            original=set(s);added=[x for x in range(universe) if x not in original]
            inp=f'1 {m}\n'+line([len(s)]+s)
        else:
            n=min(200000,scaled(i,200000));sets=[[0,1<<rng.randrange(m)] for _ in range(n)]
            inp=f'{n} {m}\n'+''.join(line([len(s)]+s) for s in sets);added=[]
        out=str(len(added))+'\n'+line(added);label='20 位值域、稠密集合与共同补集相互约束'
    elif letter=='B':
        if i in [1,3,5,7]:
            n=[0,700,0,1600,0,3500,0,7000][i];T=3;blocks=[]
            for tc in range(T):
                rx=rng.randint(10**8,4*10**8);ry=rng.randint(10**7,10**9)
                # Rounded integer ellipse vertices, with positive strict turns
                # checked again by validate-constraints.py.
                angles=[0]+sorted(rng.uniform(0,math.pi) for _ in range(n-2))+[math.pi]
                # Uniform spacing avoids rounding near-coincident vertices.
                angles=[math.pi*j/(n-1) for j in range(n)]
                pts=[(round(rx*(1+math.cos(t))),round(ry*math.sin(t))) for t in angles];pts[-1]=(0,0)
                blocks.append(str(n)+'\n'+''.join(line(p) for p in pts))
            inp=str(T)+'\n'+''.join(blocks);out=native('bread','plain\n'+inp)
            return inp,out,'非抛物线凸多边形、极扁椭圆和独立最远点穷举'
        sizes=[300,1000,3000,8000,15000,25000,35000,45000,50000,55000,60000,60001]
        n=sizes[i];T=5 if i>=10 else 1;blocks=[];params=[]
        for tc in range(T):
            a=[1,10,1000,3000][(i+tc)%4];b=0 if a>=3000 else [-1,0,1][(i+tc)%3];c=max(1,min(10,(10**9)//((n-1)**2//4 or 1)))
            pts=[(a*t+b*t*(n-1-t),c*t*(n-1-t)) for t in range(n-1,-1,-1)]
            assert all(abs(x)<=10**9 and 0<=y<=10**9 for x,y in pts)
            blocks.append(str(n)+'\n'+''.join(line(p) for p in pts));params.append(f'{n} {a} {b} {c}\n')
        # Five 60000-vertex shapes reach the aggregate 300000-vertex limit.
        if n*T>300000:
            T=4;blocks=blocks[:T];params=params[:T]
        inp=str(T)+'\n'+''.join(blocks);out=native('bread','parabola\n'+str(T)+'\n'+''.join(params));label='大型凸多边形、精确最远点与高精度积分'
    elif letter=='C':
        n=scaled(i,200000);q=n;weights=[rng.randint(1,100) for _ in range(n)];mx=max(weights);queries=[];ans=[]
        if i%3==0:
            edges=[(j,j+1) for j in range(1,n)];prefix=[0]
            for w in weights:prefix.append(prefix[-1]+w)
            for j in range(q):
                l=rng.randint(1,n-1);r=rng.randint(l,n-1);f=rng.randint(l,r);queries.append((l,r,f));ans.append(max(mx,prefix[f]-prefix[l-1],prefix[r+1]-prefix[f]))
        elif i%3==1:
            leaves=list(range(2,n+1));rng.shuffle(leaves);edges=[(1,j) for j in leaves];prefix=[0]
            for v in leaves:prefix.append(prefix[-1]+weights[v-1])
            for j in range(q):
                l=rng.randint(1,n-1);r=rng.randint(l,n-1);f=rng.randint(l,r);queries.append((l,r,f));ans.append(max(mx,weights[0]+prefix[r]-prefix[l-1]-weights[leaves[f-1]-1]))
        else:
            edges=[(j,rng.randrange(1,j)) for j in range(2,n+1)];rng.shuffle(edges)
            for j in range(q):
                if j%10000==0:l,r=1,n-1
                else:l=rng.randint(1,n-1);r=min(n-1,l+rng.randint(0,500))
                queries.append((l,r,rng.randint(l,r)))
        inp=f'1\n{n}\n'+''.join(line(p) for p in edges)+line(weights)+str(q)+'\n'+''.join(line(p) for p in queries)
        out=''.join(f'{v}\n' for v in ans) if ans else native('cut',inp);label='20 万点和询问、删边分裂与打乱边序'
    elif letter=='D':
        h=18;n=1<<h;values=[0]*(2*n);leaves=list(range(1,n+1));rng.shuffle(leaves);values[n:]=leaves
        for j in range(n-1,0,-1):values[j]=max(values[j*2],values[j*2+1])
        q=[3000,8000,18000,35000,60000,90000,140000,200000,300000,400000,524286,524287][i]
        nodes=rng.sample(range(1,2*n),q);cs=[(u,values[u]) for u in nodes]
        if i%4==1:cs[0]=(1,n-1)
        elif i%4==2:
            # Equal maxima in disjoint subtrees are impossible for a permutation.
            cs[0]=(2,n);cs[1]=(3,n)
        inp=f'{h} {q}\n'+''.join(line(p) for p in cs);out=native('divide',inp);label='18 层满树、大量限制与包含关系矛盾'
    elif letter=='E':
        T=[100,200,300,500,700,800,900,1000,1000,1000,1000,1000][i]
        pool=[10**9,999999937,999999929,2**29,3**18,5**12,7**10,2**10*3**8,720720,999999999,1]
        nums=[rng.choice(pool) if j%3 else rng.randint(1,10**9) for j in range(T)]
        inp=str(T)+'\n'+''.join(f'{x}\n' for x in nums);out=native('exponent',inp);label='十亿模数、质数幂及非循环单位群'
    elif letter=='F':
        n=scaled(i,50000)
        if i%4==0:edges=[(j,j+1) for j in range(1,n)]
        elif i%4==1:edges=[(1,j) for j in range(2,n+1)]
        elif i%4==2:edges=[(j//2,j) for j in range(2,n+1)]
        else:edges=[(rng.randint(1,j-1),j) for j in range(2,n+1)]
        rng.shuffle(edges);inp='1\n'+str(n)+'\n'+''.join(line(p) for p in edges);out=native('folding',inp);label='五万点、深链 / 多直径 / 不规则分支折叠'
    elif letter=='G':
        n=scaled(i,1000000)
        ns=[n] if i%3 else [n//3,n//3,n-2*(n//3)]
        inp=str(len(ns))+'\n'+''.join(f'{x}\n' for x in ns);out=native('ghost',inp);label='百万规模、环绕覆盖与模数计数'
    elif letter=='H':
        n=[127,255,511,512,513,999,1000,1000,1000,1000,1000,1000][i];T=10 if i>=6 else 3;paths=[]
        for j in range(T):
            p=list(range(n))
            if (i+j)%3==0:rng.shuffle(p)
            elif (i+j)%3==1:p=p[::2]+p[1::2][::-1]
            else:p.sort(key=lambda x:x^(x>>1))
            if n>1 and p[0]>p[-1]:p.reverse()
            paths.append(p)
        inp=str(T)+'\n'+''.join(str(n)+'\n'+line(p) for p in paths);out=''.join('! '+line(p) for p in paths);label='千点隐藏轨道、多组重置与位查询上限'
    elif letter=='I':
        n=scaled(i,100000);children=[[] for _ in range(n)];children[0]=[1,2]
        for j in range(3,n):
            parent=0 if i%4==0 else j//2 if i%4==1 else j-1 if i%4==2 else rng.randrange(j)
            children[parent].append(j)
        for g in children:rng.shuffle(g)
        inp='1\n'+str(n)+'\n'+''.join(line([len(g)]+[v+1 for v in g]) for g in children);out=native('island',inp);label='十万节点、长链和高分支树、叶序连边期望'
    elif letter=='J':
        kinds={'WrongProblem':100,'SameProblem':30,'UnreasonableLimitForProblem':5,'WeakTestsForProblem':3,'BadProblem':1}
        reviews=[];score=0
        for j in range(1000):
            if j%13==0:s='UnreasonableProblemArrangement';score+=10
            else:
                prefix=rng.choice(list(kinds));suffix=rng.choice(['A','L','M','a','AA','']);s=prefix+suffix
                if len(suffix)==1 and 'A'<=suffix<='L':score+=kinds[prefix]
                if j%11==0:s=s[:-1]+s[-1:].lower();score-=kinds[prefix] if len(suffix)==1 and 'A'<=suffix<='L' else 0
            reviews.append(s)
        budget=max(0,score+[-1,0,1][i%3]);inp=f'1\n1000 {budget}\n'+'\n'.join(reviews)+'\n';out='Joker\n' if score>budget else 'Judger\n';label='千条评价、大小写、范围和严格大于边界'
    elif letter=='K':
        n=5000;q=scaled(i,500000);a=[rng.randrange(n) for _ in range(n)]
        if i%4==0:a=list(range(n));rng.shuffle(a)
        elif i%4==1:a=[rng.choice([0,1,10**9,rng.randrange(200)]) for _ in range(n)]
        queries=[rng.choice([rng.randrange(2*n+1),10**9,10**9-1,0]) for _ in range(q)]
        inp=one_array(a)+str(q)+'\n'+''.join(f'{x}\n' for x in queries);out=native('kmex',inp);label='五千元素和五十万询问、重复值与补数冲突'
    elif letter=='L':
        n=scaled(i,100000);a=[rng.randint(0,10**9) for _ in range(n)]
        if i%3==0:a=[0 if j%(11+i) else 10**9 for j in range(n)]
        elif i%3==1:a[0]=10**9;a[-1]=0
        inp=one_array(a);out=native('loop',inp);label='十万长度、64 位路径和与绕圈方向'
    else:raise KeyError(letter)
    return inp,out,label

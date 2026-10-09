"""Constraint-valid stress files, exact structural identities + fast oracles."""
import math
import liaoning as small
from liaoning import line,one_array,MOD
from stress_common import native,scaled,phi,factorial_mod

def make(letter,index,trick,rng):
    if trick is not None:
        # Keep minimal counterexamples as well as the maximum-size pressure files.
        return small.make(letter,index,trick,rng)
    i=index;label=f'压力数据 {i+1}'
    if letter=='A':
        n=min(5000,[200,500,1000,2000,3000,4000,4999,5000,4800,4500,3500,2500][i])
        birds=[];food=[];moves=[]
        if i%4==3:
            birds=[(5000,5000)]+[(2,j+1) for j in range(n-1)]
            food=[(4,j+1) for j in range(n)]
            out='No\n';label='大规模无解与无法到达的孤立海鸥'
        else:
            # Each group has exactly one bird requiring the intact whole row.
            # Removing an interior bird first prevents that jump.
            width=min(n,2000);groups=(n+width-1)//width
            for g in range(groups):
                m=min(width,n-g*width);row=3+3*g
                start=len(birds);birds += [(row,j+1) for j in range(m)]
                food += [(row,m+1)]+[(row-1,j+1) for j in range(1,m)]
                moves += [(start+1,'R')]+[(start+j+1,'U') for j in range(1,m)]
            # Relabel IDs without changing the certified movement order.
            order=list(range(n));rng.shuffle(order);ids={old:new+1 for new,old in enumerate(order)}
            birds=[birds[j] for j in order];rng.shuffle(food)
            out='Yes\n'+''.join(f'{ids[j-1]} {d}\n' for j,d in moves)
            label='连续阻挡、移除顺序与打乱编号'
        inp='1\n'+str(n)+'\n'+''.join(line(p) for p in birds+food)
    elif letter=='B':
        T=[300,500,1000,2000,4000,6000,10000,15000,20000,30000,40000,50000][i]
        pool=[10**7,9999991,9999973,2**23,5**10,2**9*5**6]+[rng.randint(1,10**7) for _ in range(80)]
        cache={};inputs=[];outputs=[]
        for tc in range(T):
            m=rng.choice(pool);keep=rng.randint(1,9);banned=[d for d in range(1,10) if d!=keep]
            if tc%11==0:banned=list(range(1,10))
            elif tc%7==0:banned=rng.sample(range(1,10),rng.randrange(9))
            inputs.append(f'{m} {len(banned)}\n'+line(banned))
            allowed=[d for d in range(1,10) if d not in banned]
            if not allowed:outputs.append('-1\n');continue
            if m not in cache:
                u=m;e2=e5=0
                while u%2==0:u//=2;e2+=1
                while u%5==0:u//=5;e5+=1
                cache[m]=(phi(9*u),max(e2,e5))
            length,zeros=cache[m];blocks=[(allowed[0],length)]
            if zeros:blocks.append((0,zeros))
            outputs.append(str(len(blocks))+'\n'+''.join(f'{d} {c}\n' for d,c in blocks))
        inp=str(T)+'\n'+''.join(inputs);out=''.join(outputs);label='大量模数、唯一可用数字与压缩超长答案'
    elif letter=='C':
        # This problem only accepts two three-digit weights; no invented large input.
        a=[999,100,998,101,500,777,123,890,456,999,100,888][i]
        b=[999,101,997,100,500,776,999,100,457,100,999,887][i]
        inp=f'{a}g {b}g\n';out=f'{int(b>=a)}\n';label='单位解析与等值 / 相差一克边界'
    elif letter=='D':
        masks=[rng.choice([3,5,6]) for _ in range(100)] if i%3==0 else [rng.randrange(1,8) for _ in range(100)]
        if i%3==2:masks=[rng.choice([1,3,5,7]) for _ in range(99)]+[2 if i%2 else 4]
        rows=[[(x>>j)&1 for j in range(3)] for x in masks]
        ans=min(mask.bit_count() for mask in range(1,8) if all(mask&x for x in masks))
        inp='100\n'+''.join(line(a) for a in rows);out=f'{ans}\n';label='满规模机关、重复材质与末尾约束'
    elif letter=='E':
        n=scaled(i,100000)
        if i%4==0:a=[rng.randint(1,10**9) for _ in range(n)]
        elif i%4==1:a=[rng.choice([1,11,111111111,1000000000,22222222,87654321]) for _ in range(n)]
        elif i%4==2:a=[9 if j%997==0 else rng.choice([1,12,333,4444]) for j in range(n)]
        else:a=[rng.choice([999999999,999999998,888888888,777777777]) for _ in range(n)]
        inp=one_array(a);out=native('entering',inp);label='大数组、稀疏最大数字与 64 位子段计数'
    elif letter=='F':
        n=scaled(i,1000000);m=n if i<10 else 1000000
        p=[m,0,m//2,m//3,1,m-1,0,m//2,m//2,m//3,m,0][i];s=[0,m,m-p,m//2,m-1,1,0,m//2,0,0,0,m][i]
        a=[rng.randrange(999000000,1000000001) for _ in range(m)]
        inp='1\n'+f'{n} {m} {p} {s}\n'+line(a);out=native('stones',inp)
        label='百万局、Lucas 位边界与空 / 整段前后缀'
    elif letter=='G':
        n=250-i%6
        if i%3==0:
            # Uniform threshold: choose l absent Prüfer symbols, then a
            # surjection onto the other n-l labels. Stirling DP is O(n^2).
            threshold=[4,5,12,40][i//3];a=[threshold]*n;stirling=[0]*(n-1);stirling[0]=1
            for j in range(1,n-1):
                for k in range(j,0,-1):stirling[k]=(stirling[k-1]+k*stirling[k])%MOD
                stirling[0]=0
            ans=sum(math.comb(n,l)*math.factorial(n-l)*stirling[n-l] for l in range(threshold,n) if n-l<len(stirling))%MOD
        elif i%3==2:
            a=[rng.choice([1,2,3]) for _ in range(n)];r=a.count(3)
            valid=0 if r>2 else math.comb(n-r,2-r)*math.factorial(n-2)
            ans=(pow(n,n-2,MOD)-math.factorial(n)//2+valid)%MOD
        elif i%3==1:a=[rng.choice([n-1,n]) for _ in range(n)];ans=a.count(n-1)
        inp=one_array(a);out=f'{ans}\n';label='250 点、并列中心与路径 / 星形排除计数'
    elif letter=='H':
        n=scaled(i,500000);q=n;shape='chain' if i%2==0 else 'star'
        parents=[j if shape=='chain' else 1 for j in range(1,n)]
        edges=''.join(f'{p} {rng.randint(1,100)}\n' for p in parents)
        ops=[]
        for j in range(q):
            x=1 if j%7==0 else rng.randint(1,n)
            if j%3==2:ops.append(f'2 {x}\n')
            else:ops.append(f'1 {x} {x if j%5==0 else rng.choice([1,n,rng.randint(1,n)])}\n')
        inp=f'{n} {q}\n'+edges+''.join(ops);out=native('mail',shape+'\n'+inp)
        label='深链 / 高度数树、海量区间更新与大距离和'
    elif letter=='I':
        n=scaled(i,1000000);a=[rng.randint(0,10**9) for _ in range(n)]
        if i%3==0:a=[rng.choice([0,1,999999999,1000000000]) for _ in range(n)]
        if i%4==1:a.sort(reverse=True)
        elif i%4==2:a.sort()
        x=a[0]
        for v in sorted(a[1:]):x=max(x,(x+v+1)//2)
        inp=one_array(a);out=f'{x}\n';label='百万角色、转移顺序与取整边界'
    elif letter=='J':
        n=scaled(i,300000);m=n;groups=[[] for _ in range(n)];ops=[];student=100000000
        active=[]
        for j in range(m):
            if len(active)>=2 and j%3!=0:
                a,b=rng.sample(active,2);x=rng.randrange(len(groups[a]));y=rng.randrange(len(groups[b]));groups[a][x],groups[b][y]=groups[b][y],groups[a][x]
                ops.append(f'2 {a+1} {x+1} {b+1} {y+1}\n')
            else:
                a=rng.randrange(min(n,100 if i%2 else n));
                if not groups[a]:active.append(a)
                groups[a].append(student);ops.append(f'1 {a+1} {student}\n');student+=1
        inp=f'{n} {m}\n'+''.join(ops);out=''.join(line([len(g)]+g) for g in groups);label='海量插入与交叉交换、空组输出'
    elif letter=='K':
        n=scaled(i,3000000)
        patterns=['0','1','01','001011','000001','1110110']
        if i%4==3:s=''.join(rng.choice('01') for _ in range(n))
        else:
            p=patterns[i%len(patterns)];s=(p*((n+len(p)-1)//len(p)))[:n]
            if i%5==2:s='0'*(n//3)+s[n//3:]
        inp='1\n'+s+'\n';out=native('kanon',inp);label='长串、前导零、周期 LCP 与组合计数'
    elif letter=='L':
        n=[100,200,400,600,800,1000,1200,1400,1600,1800,1999,2000][i]
        r=list(range(1,n+1));c=r.copy();rng.shuffle(r);rng.shuffle(c)
        if i%3==0:c=r[::-1]
        inp='1\n'+str(n)+'\n'+line(r)+line(c);out=''.join(line([min(x,y)-1 for y in c]) for x in r);label='最大矩阵、打乱排列与输出压力'
    elif letter=='M':
        n=scaled(i,1000000);pairs=[(rng.randrange(10**18+1),rng.randrange(10**18+1)) for _ in range(n)]
        if i%3==0:pairs=[(rng.randint(0,10),rng.choice([0,1,10**18,rng.randint(0,15)])) for _ in range(n)]
        elif i%3==1:pairs=[(j if j%2 else 0,j+1) for j in range(n)]
        x=ans=0
        for a,b in sorted(pairs,key=lambda p:(max(p),min(p))):
            if x<=a:x=max(x,b);ans+=1
        rng.shuffle(pairs);inp=str(n)+'\n'+''.join(line(p) for p in pairs);out=f'{ans}\n';label='百万比赛、错误排序贪心与 10^18 边界'
    else:raise KeyError(letter)
    return inp,out,label

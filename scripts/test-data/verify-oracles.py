"""Cross-check small exhaustive reference programs against official examples."""
import json,pathlib,sys
from collections import deque
from itertools import combinations
from math import factorial
import liaoning as ln, online1 as one, online2 as two
ROOT=pathlib.Path(__file__).resolve().parents[2]
checks=0
def same(answer,expected,label):
    global checks
    assert str(answer).split()==expected.split(),f'{label}: {str(answer)[:120]} != {expected[:120]}'
    checks+=1
def array_cases(s):
    a=list(map(int,s.split()));i=1;out=[]
    for _ in range(a[0]):n=a[i];i+=1;out.append(a[i:i+n]);i+=n
    return out

def stars_from_degrees(a):
    # An independent Prüfer multinomial count avoids enumerating n^(n-2)
    # sequences for the larger official example.
    n=len(a);answer=0
    def visit(counts,left):
        nonlocal answer
        if len(counts)==n-1:
            counts=counts+[left];leaves=counts.count(0);mx=max(counts)
            if all(a[i]<=leaves for i,c in enumerate(counts) if c==mx):
                ways=factorial(n-2)
                for c in counts:ways//=factorial(c)
                answer+=ways
            return
        for c in range(left+1):visit(counts+[c],left-c)
    visit([],n-2)
    return answer%ln.MOD

data=json.loads((ROOT/'src/problems.json').read_text(encoding='utf-8'))
for p in data:
    for sample in p['samples']:
        s,e=sample['input'],sample['output'];a=list(s.split());label='LNCPC/'+p['id']
        if p['id']=='C':same(int(int(a[1][:-1])>=int(a[0][:-1])),e,label)
        if p['id']=='D':
            rows=[list(map(int,a[i:i+3])) for i in range(1,len(a),3)]
            same(min(mask.bit_count() for mask in range(1,8) if all(any(mask>>i&1 and row[i] for i in range(3)) for row in rows)),e,label)
        if p['id'] in ['E','G','I']:
            fn={'E':ln.entering,'G':stars_from_degrees,'I':ln.cards}[p['id']]
            arrays=array_cases(s)
            same('\n'.join(str(fn(x)) for x in arrays),e,label)
        if p['id']=='K':same(''.join(ln.kanon(x) for x in a[1:]),e,label)
        if p['id']=='M':same(ln.capoo([tuple(map(int,a[i:i+2])) for i in range(1,len(a),2)]),e,label)

data=json.loads((ROOT/'src/data/icpc-online-2026-1.json').read_text(encoding='utf-8'))
for p in data:
    for sample in p['samples']:
        s,e=sample['input'],sample['output'];a=s.split();label='Online I/'+p['id']
        if p['id']=='B':same(one.mod_counts(list(map(int,a[2:])),int(a[1])),e,label)
        if p['id']=='D':same(one.sequence_count(list(map(int,a[1:]))),e,label)
        if p['id']=='F':
            n,m=map(int,a[:2]);scores=[0]+[sum(map(int,a[2+i*m:2+(i+1)*m])) for i in range(n)];same(sum(x<y for y,x in zip(scores,scores[1:])),e,label)
        if p['id']=='G':
            n,m,b=map(int,a[:3]);costs=list(map(int,a[3:3+n]));edges=[(int(a[i])-1,int(a[i+1])-1) for i in range(3+n,len(a),2)];same(one.routes(n,edges,costs,b),e,label)
        if p['id']=='H':
            text=a[0];q=int(a[1]);i=2;out=[]
            for _ in range(q):
                n,b=map(int,a[i:i+2]);i+=2;ss=a[i:i+n];i+=n
                out.append(next((x for x in range(1,len(text)+1) if sum(one.score(v,text[:x]) for v in ss)>=b),-1))
            same('\n'.join(map(str,out)),e,label)
        if p['id']=='I' and int(a[0])<=100:same(one.lamp(int(a[0]),list(map(int,a[2:]))),e,label)
        if p['id']=='J':same(one.string_ops(a[2],[tuple(map(int,a[i:i+3])) for i in range(3,len(a),3)]),e,label)
        if p['id']=='L':same(one.prefix_answers(a[1:]),e,label)
        if p['id']=='N':same(one.red([tuple(map(int,a[i:i+3])) for i in range(1,len(a),3)]),e,label)

data=json.loads((ROOT/'src/data/icpc-online-2026-2.json').read_text(encoding='utf-8'))
for p in data:
    for sample in p['samples']:
        s,e=sample['input'],sample['output'];a=list(map(int,s.split())) if p['id'] not in ['H','J'] else [];label='Online II/'+p['id']
        if p['id']=='D':same(two.divide(a[0],[tuple(a[i:i+2]) for i in range(2,len(a),2)]),e,label)
        if p['id']=='E' and max(a[1:])<=500:same('\n'.join(str(two.exponent(x)) for x in a[1:]),e,label)
        if p['id']=='G':
            expected=e.splitlines()
            for i,n in enumerate(a[1:]):
                if n<=5:same(two.ghost(n),'\n'.join(expected[i*2:i*2+2]),label+f' n={n}')
        if p['id']=='I':
            i=1;expected=e.splitlines()
            for tc in range(a[0]):
                n=a[i];i+=1;children=[]
                for _ in range(n):c=a[i];i+=1;children.append([x-1 for x in a[i:i+c]]);i+=c
                if n<=10:same(two.island(children),expected[tc],label)
        if p['id']=='K':
            i=1;out=[]
            for _ in range(a[0]):
                n=a[i];i+=1;values=a[i:i+n];i+=n;q=a[i];i+=1;ans=0
                for k in a[i:i+q]:ans^=two.kmex(values,k)
                i+=q;out.append(ans)
            same('\n'.join(map(str,out)),e,label)
        if p['id']=='L':same('\n'.join(str(two.loop(x)) for x in array_cases(s)),e,label)

# Independently verify Bread's rectangle integral by rotating vertices densely
# and integrating the upper envelope with a midpoint Riemann sum. The numerical
# approximation is only a cross-check; stored answers use the exact integral.
from math import hypot, cos, sin, pi
def sampled_rectangle(w,h):
    R=hypot(w,h);centers=[w,w+h,2*w+h,2*w+2*h];P=2*(w+h)
    steps=50000;dx=P/steps;total=0
    for i in range(steps):
        x=(i+.5)*dx
        total+=max((max(0,R*R-(x-c-shift*P)**2))**.5 for c in centers for shift in [-1,0,1])
    return total/steps
for w,h in [(1,1),(3,7),(1000,1)]:
    expected=two.bread(w,h);assert abs(sampled_rectangle(w,h)-expected)<=max(1,expected)*1e-7
    checks+=1
print(f'{checks} independent comparisons passed against official sample outputs and rectangle integration.')

"""Parse every stress file against the actual statement constraints."""
import json,gzip,pathlib,hashlib,math
ROOT=pathlib.Path(__file__).resolve().parents[2]
class Input:
    def __init__(self,s):self.a=s.split();self.i=0
    def word(self):v=self.a[self.i];self.i+=1;return v
    def num(self,lo=0,hi=10**18):
        w=self.word();assert w.lstrip('-').isdigit();v=int(w);assert lo<=v<=hi,(v,lo,hi);return v
    def arr(self,n,lo=0,hi=10**18):return [self.num(lo,hi) for _ in range(n)]
    def end(self):assert self.i==len(self.a),(self.i,len(self.a))
def binary_rows(r,n,k):
    for _ in range(n):assert any(r.arr(k,0,1))
def validate(cid,p,s):
    r=Input(s);id=p['id'];stats={}
    def number(name,lo,hi):
        v=r.num(lo,hi);stats[name]=max(stats.get(name,0),v);return v
    if cid=='lncpc-2025':
        if id in 'ABEFGIKL':
            caps={'A':1000,'B':50000,'E':10000,'F':10000,'G':50,'I':10000,'K':10000,'L':1000};T=number('cases',1,caps[id]);total=rounds=0
            for _ in range(T):
                if id=='A':
                    n=number('n',1,5000);total+=n;pts=[tuple(r.arr(2,1,5000)) for _ in range(2*n)];assert len(set(pts))==2*n
                elif id=='B':
                    number('m',1,10**7);k=r.num(0,9);a=r.arr(k,1,9);assert len(set(a))==k
                elif id=='E':n=number('n',1,100000);total+=n;r.arr(n,1,10**9)
                elif id=='F':
                    rounds+=number('rounds',1,1000000);m=number('m',1,1000000);total+=m;p0=r.num(0,m);s0=r.num(0,m);assert p0+s0<=m;r.arr(m,1,10**9)
                elif id=='G':n=number('n',3,250);total+=n;r.arr(n,1,n)
                elif id=='I':n=number('n',1,1000000);total+=n;r.arr(n,0,10**9)
                elif id=='K':
                    s0=r.word();assert s0 and set(s0)<={'0','1'};total+=len(s0);stats['length']=max(stats.get('length',0),len(s0))
                elif id=='L':
                    n=number('n',1,2000);total+=n
                    for _ in range(2):assert sorted(r.arr(n,1,n))==list(range(1,n+1))
            if id!='B':assert total<={'A':5000,'E':100000,'F':1000000,'G':250,'I':1000000,'K':3000000,'L':2000}[id]
            assert rounds<=1000000;stats['total']=total
        elif id=='C':
            for _ in range(2):w=r.word();assert len(w)==4 and w[-1]=='g' and w[:3].isdigit() and 100<=int(w[:3])<=999
        elif id=='D':n=number('n',1,100);binary_rows(r,n,3)
        elif id=='H':
            n=number('n',1,500000);q=number('q',1,500000)
            for j in range(2,n+1):r.num(1,j-1);r.num(1,100)
            for _ in range(q):op=r.num(1,2);r.num(1,n);r.num(1,n) if op==1 else None
        elif id=='J':
            n=number('n',1,300000);m=number('q',1,300000);sizes=[0]*n;seen=set()
            for _ in range(m):
                op=r.num(1,2);a=r.num(1,n)-1
                if op==1:
                    x=r.num(10**8,10**9-1);assert x not in seen;seen.add(x);sizes[a]+=1
                else:j=r.num(1,sizes[a]);b=r.num(1,n)-1;assert b!=a;r.num(1,sizes[b])
        elif id=='M':n=number('n',1,1000000);r.arr(2*n,0,10**18)
    elif cid=='icpc-online-2026-1':
        if id in 'ACEK':
            T=number('cases',1,{'A':100000,'C':1000000,'E':10000,'K':100000}[id]);total=cs=perms=0
            for _ in range(T):
                n=number('n',2 if id=='K' else 1,{'A':1000000,'C':1000000,'E':8000000,'K':500000}[id]);total+=n
                if id=='A':
                    for _ in range(n):assert r.word() in ['+','T','F'];r.num(1,10**9)
                elif id=='C':
                    m=number('constraints',1,1000000);cs+=m
                    for _ in range(m):
                        l=r.num(1,n);rr=r.num(l,n);a=r.arr(rr-l+1,l,rr);assert len(set(a))==len(a);perms+=len(a)
                elif id=='K':
                    d=r.word();assert len(d)==n and set(d)<={'L','R'};r.arr(n,0,n)
            assert total<={'A':1000000,'C':1000000,'E':8000000,'K':500000}[id];assert cs<=1000000 and perms<=1000000;stats['total']=total
        elif id=='B':
            n=number('n',1,262143);number('v',1,262143);a=r.arr(n,1,262143);assert all(a[j]<a[j+1] for j in range(n-1))
        elif id=='D':n=number('n',1,100000);r.arr(n,0,n-1)
        elif id=='F':n=number('n',1,50);m=number('m',1,13);r.arr(n*m,-1000,-1)
        elif id=='G':
            n=number('n',1,90);m=number('m',0,300);r.num(0,10**12);r.arr(n,0,10**12);edges=[tuple(r.arr(2,1,n)) for _ in range(m)];assert all(a!=b for a,b in edges) and len(set(edges))==m
        elif id=='H':
            text=r.word();assert text.isascii() and text.islower() and text.isalpha() and len(text)<=200000;q=number('q',1,200000);total=0
            for _ in range(q):
                a=r.num(1,200000);r.num(1,10**18)
                for _ in range(a):w=r.word();assert w.isascii() and w.islower() and w.isalpha();total+=len(w)
            assert total<=200000;stats.update(length=len(text),patternCharacters=total)
        elif id=='I':number('n',1,10**9);T=number('q',1,5);r.arr(T,1,2*10**18)
        elif id=='J':
            n=number('n',1,100000);q=number('q',1,100000);w=r.word();assert len(w)==n and set(w)<={'N','H'}
            for _ in range(q):r.num(1,4);r.num(1,n);r.num(0,10**18)
        elif id in 'LM':
            n=number('n',1,500000 if id=='L' else 100000);m=number('q',1,100000) if id=='M' else 0;words=[r.word() for _ in range(n+m)]
            assert all(w.isascii() and w.isalpha() and (id=='M' or w.islower()) for w in words)
            assert sum(map(len,words))<=(500000 if id=='L' else 1000000)
            if id=='M':assert len(set(words[:n]))==n
            stats['characters']=sum(map(len,words))
        elif id=='N':n=number('n',1,1000000);binary_rows(r,n,3)
    else:
        if id=='A':
            n=number('n',1,200000);m=number('m',1,20);total=0
            for _ in range(n):c=r.num(1,1000000);a=r.arr(c,0,(1<<m)-1);total+=c;assert len(set(a))==c
            assert total<=1000000;stats['elements']=total
        elif id=='D':h=number('height',1,18);q=number('q',0,(1<<(h+1))-1);[(r.num(1,(1<<(h+1))-1),r.num(1,1<<h)) for _ in range(q)]
        else:
            T=number('cases',1,{'B':1000,'C':100000,'E':1000,'F':3000,'G':1000000,'H':10000,'I':1000,'J':1000,'K':1000,'L':1000}[id]);total=totalq=0
            for _ in range(T):
                if id=='E':number('modulus',1,10**9);continue
                if id=='J':
                    n=number('reviews',0,1000);total+=n;r.num(0,100000)
                    for _ in range(n):w=r.word();assert w.isascii() and w.isalpha() and 1<=len(w)<=50
                    continue
                n=number('n',{'B':3,'C':2,'I':3}.get(id,1),{'B':100000,'C':200000,'F':50000,'G':1000000,'H':1000,'I':100000,'K':5000,'L':100000}[id]);total+=n
                if id=='B':
                    pts=[(r.num(-10**9,10**9),r.num(0,10**9)) for _ in range(n)];assert pts[0][0]>0 and pts[0][1]==0 and pts[-1]==(0,0);assert len(set(pts))==n
                    # Strictly positive turns ensure a strict CCW convex polygon
                    # for these certified parabolic and rectangle families.
                    for j in range(n):
                        a,b,c=pts[j],pts[(j+1)%n],pts[(j+2)%n];assert (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])>0
                elif id in 'CF':
                    parent=list(range(n+1))
                    def find(x):
                        while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
                        return x
                    for _ in range(n-1):
                        a=r.num(1,n);b=r.num(1,n);assert a!=b and find(a)!=find(b);parent[find(a)]=find(b)
                    if id=='C':
                        r.arr(n,1,100);q=number('q',1,200000);totalq+=q
                        for _ in range(q):l=r.num(1,n-1);rr=r.num(l,n-1);r.num(l,rr)
                elif id=='H':
                    p=r.arr(n,0,n-1);assert len(set(p))==n and (n==1 or p[0]<p[-1])
                elif id=='I':
                    seen=set();children=[]
                    for u in range(n):
                        c=r.num(0,n-1);a=r.arr(c,2,n);assert len(set(a))==c and not (set(a)&seen);seen.update(a);children.append(a)
                    assert len(seen)==n-1 and len(children[0])>=2
                    reached={1};stack=[1]
                    while stack:
                        for v in children[stack.pop()-1]:assert v not in reached;reached.add(v);stack.append(v)
                    assert len(reached)==n
                elif id=='K':r.arr(n,0,10**9);q=number('q',1,500000);totalq+=q;r.arr(q,0,10**9)
                elif id=='L':r.arr(n,0,10**9)
            assert total<={'B':300000,'C':200000,'E':0,'F':50000,'G':1000000,'H':10000,'I':300000,'J':1000,'K':5000,'L':100000}[id];assert totalq<=(500000 if id=='K' else 200000);stats['total']=total
    r.end();return stats

if __name__=='__main__':
    report=[];count=0;errors=[]
    for cid,file in [('lncpc-2025','src/problems.json'),('icpc-online-2026-1','src/data/icpc-online-2026-1.json'),('icpc-online-2026-2','src/data/icpc-online-2026-2.json')]:
        for p in json.loads((ROOT/file).read_text(encoding='utf-8')):
            maxima={};totalbytes=0;packedbytes=0
            for index,t in enumerate(p['tests'],1):
                if 'file' in t:
                    raw=(ROOT/'public'/t['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==t['sha256'];data=json.loads(gzip.decompress(raw));packedbytes+=len(raw)
                else:data=t
                try:stats=validate(cid,p,data['input'])
                except Exception as e:
                    errors.append(f'{cid}/{p["id"]}/{index}: {e}');continue
                for k,v in stats.items():maxima[k]=max(maxima.get(k,0),v)
                totalbytes+=len(data['input'].encode());count+=1
            report.append(dict(contest=cid,problem=p['id'],maxima=maxima,inputBytes=totalbytes,compressedBytes=packedbytes))
            print(cid,p['id'],maxima,flush=True)
    assert not errors, '\n'.join(errors)
    (ROOT/'src/data/stress-report.json').write_text(json.dumps(dict(files=count,problems=report),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{count} files passed all statement bounds, formats and structural constraints.')

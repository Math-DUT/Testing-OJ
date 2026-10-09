import pathlib, subprocess
from liaoning import line, MOD
ROOT=pathlib.Path(__file__).resolve().parents[2]
def native(mode,input_):
    return subprocess.run([str(ROOT/'tmp/fast-oracles.exe'),mode],input=input_,
        text=True,capture_output=True,check=True,timeout=240).stdout
def scaled(i,cap):
    return min(cap, [3000,8000,18000,35000,60000,90000,140000,200000,300000,400000,cap-1,cap][i])
def phi(n):
    out=n;p=2
    while p*p<=n:
        if n%p==0:
            out=out//p*(p-1)
            while n%p==0:n//=p
        p+=1 if p==2 else 2
    return out//n*(n-1) if n>1 else out
def factorial_mod(n):
    out=1
    for i in range(1,n+1):out=out*i%MOD
    return out

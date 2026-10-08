# B. Mod

Given a strictly increasing sequence $a$ of length $n$ and an initial value $v_0$.

For all $0\le v'\le v_0$, find the number of permutations $p$ of length $n$ such that the following procedure yields final value $v=v'$:

1. Initialize $v\leftarrow v_0$.
2. For $i=1,2,\ldots,n$, update $v\leftarrow v\bmod a_{p_i}$.

Output the answer modulo $998244353$.

## Input

The first line contains two integers $n$ and $v_0$ ($1\le n<2^{18}$, $1\le v_0<2^{18}$).

The second line contains $n$ integers $a_1,a_2,\ldots,a_n$ ($1\le a_1<a_2<\cdots<a_n<2^{18}$).

## Output

Output $v_0+1$ integers, where the $i$-th integer ($1\le i\le v_0+1$) represents the answer for $v'=i-1$, modulo $998244353$.

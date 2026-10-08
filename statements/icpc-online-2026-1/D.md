# D. Sequence

Given a 01-sequence $s_1,s_2,\ldots,s_n$ of length $n$, define

$$
p_i=\sum_{j=1}^{i}[s_i\ne s_j],
$$

where $[\,]$ is the Iverson bracket ($1$ if the condition holds, $0$ otherwise).

You are given the integer $n$ and the multiset $\{p'_1,p'_2,\ldots,p'_n\}$ of the values $\{p_1,p_2,\ldots,p_n\}$.

Count the number of sequences $s$ that satisfy the condition. Output the answer modulo $998244353$.

It is guaranteed that there exists at least one string satisfying the conditions.

## Input

The first line contains a single integer $n$ ($1\le n\le 10^5$).

The second line contains $n$ integers $p'_1,p'_2,\ldots,p'_n$ ($0\le p'_i\le n-1$) — the multiset.

## Output

Print a single integer — the number of valid binary strings modulo $998244353$.

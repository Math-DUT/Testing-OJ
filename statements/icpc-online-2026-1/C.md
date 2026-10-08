# C. Permutation Inversions

There is an unknown permutation $p=(p_1,p_2,\ldots,p_n)$ of the integers $1,2,\ldots,n$. You are given $m$ pieces of information about this permutation.

Each piece of information consists of an interval $[l_i,r_i]$ and a permutation $q_{i,1},q_{i,2},\ldots,q_{i,r_i-l_i+1}$ of the indices in this interval. It states that

$$
p_{q_{i,1}}<p_{q_{i,2}}<\cdots<p_{q_{i,r_i-l_i+1}}.
$$

Your task is to find a permutation that satisfies all the given information and has the minimum possible number of inversions. If no such permutation exists, output $-1$.

If several optimal permutations exist, output any of them.

The number of inversions of a permutation $p$ is the number of pairs of indices $(x,y)$ such that $1\le x<y\le n$ and $p_x>p_y$.

## Input

The first line contains a single integer $T$ ($1\le T\le 10^6$) — the number of test cases.

For each test case:

- The first line contains two integers $n$ ($1\le n\le 10^6$) and $m$ ($1\le m\le 10^6$) — the size of the permutation and the number of constraints.
- Each of the next $m$ lines describes a constraint. The $i$-th constraint starts with two integers $l_i$ and $r_i$ ($1\le l_i\le r_i\le n$), followed by $r_i-l_i+1$ integers $q_{i,1},q_{i,2},\ldots,q_{i,r_i-l_i+1}$, which form a permutation of the integers from $l_i$ to $r_i$.

It is guaranteed that $1\le\sum n\le 10^6$, $1\le\sum m\le 10^6$, and $1\le\sum\limits_{\text{all test cases}}\sum\limits_{i=1}^{m}(r_i-l_i+1)\le 10^6$ over all test cases.

## Output

For each test case, print a single line:

- If no satisfying permutation exists, print `-1`.
- Otherwise, print $n$ space-separated integers $p_1,p_2,\ldots,p_n$ representing a valid permutation that minimizes the number of inversions.

If there are multiple optimal permutations, print any of them.

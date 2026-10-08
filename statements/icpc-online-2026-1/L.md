# L. Longest Common Prefix

You are given $n$ lowercase English strings $s_1,s_2,\ldots,s_n$.

For each pair of integers $(i,j)$ satisfying $1\le j\le i\le n$, define $f_{i,j}$ as the maximum possible length of the longest common prefix of exactly $j$ strings selected from the first $i$ strings. Formally,

$$
f_{i,j}=\max_{\substack{T\subseteq\{1,2,\ldots,i\}\\|T|=j}}\left|\operatorname{LCP}(s_k\mid k\in T)\right|.
$$

The longest common prefix of a single string is the string itself.

For each $i=1,2,\ldots,n$, calculate

$$
\sum_{j=1}^{i}(f_{i,j}\oplus j),
$$

where $\oplus$ denotes the bitwise XOR operation.

## Input

The first line contains an integer $n$ ($1\le n\le 5\cdot 10^5$), the number of strings.

Each of the next $n$ lines contains a non-empty string $s_i$ consisting only of lowercase English letters.

It is guaranteed that

$$
\sum_{i=1}^{n}|s_i|\le 5\cdot 10^5.
$$

## Output

Print $n$ lines. The $i$-th line should contain one integer:

$$
\sum_{j=1}^{i}(f_{i,j}\oplus j).
$$

## Note

The longest common prefix of several strings is the longest string that is a prefix of every selected string.

The symbol $\oplus$ denotes the bitwise XOR operation.

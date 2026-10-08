# H. The First Problem

For a string $A$, let $\operatorname{pref}(A,i)$ denote the prefix of $A$ of length $i$.

For strings $A,B$, let $\operatorname{occur}(A,B)$ denote the number of occurrences of $A$ in $B$.

Define:

$$
\operatorname{score}(A,B)=\sum_{i=1}^{\operatorname{len}(A)}\sum_{j=1}^{\operatorname{len}(B)}\operatorname{occur}(\operatorname{pref}(A,i),\operatorname{pref}(B,j)).
$$

That is, the sum over every prefix of $A$ of its number of occurrences in every prefix of $B$.

You are given a text string $T$.

There are $q$ queries, each given by $a_i$ pattern strings $S_1,S_2,\ldots,S_{a_i}$ and an integer $b_i$.

For each query, find the minimum $x$ such that:

$$
\sum_{j=1}^{a_i}\operatorname{score}(S_j,\operatorname{pref}(T,x))\ge b_i.
$$

If no such $x$ exists, output $-1$.

## Input

The first line contains the text string $T$ ($1\le |T|\le 2\times 10^5$, where $|T|$ denotes the length of $T$).

The second line contains a single integer $q$ ($1\le q\le 2\times 10^5$).

For each query, the first line contains two integers $a_i,b_i$ ($1\le a_i\le 2\times 10^5$, $1\le b_i\le 10^{18}$). The following $a_i$ lines each contain a pattern string $S_1,S_2,\ldots,S_{a_i}$ in order.

$\sum |S|\le 2\times 10^5$, where $\sum |S|$ is the total length of all pattern strings across all queries in one test case.

All strings consist of lowercase English letters.

## Output

Output $q$ lines, the answer to each query in order.

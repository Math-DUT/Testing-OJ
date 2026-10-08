# J. String

You are given a string $S$ of length $n$, indexed from $1$ to $n$. Every character of $S$ is either `N` or `H`.

You must process $T$ operations in order. An operation is described by three integers $op,p$, and $k$, and consists of repeating the following procedure exactly $k$ times. Every repetition starts at position $p$ and uses the current string obtained after all previous repetitions and operations.

For one repetition, choose a direction and a stopping character according to $op$:

- If $op=1$, move to the right and use `N` as the stopping character.
- If $op=2$, move to the right and use `H` as the stopping character.
- If $op=3$, move to the left and use `N` as the stopping character.
- If $op=4$, move to the left and use `H` as the stopping character.

Start at position $p$. At every visited position, first flip its character: `N` becomes `H`, and `H` becomes `N`. If the character **before the flip** was the stopping character, the repetition ends immediately. Otherwise, move by one position in the chosen direction and continue. If there is no next position in that direction, the repetition ends after flipping the boundary character.

Determine the string after all operations have been performed.

## Input

The first line contains two integers $n$ and $T$ ($1\le n,T\le 10^5$) — the length of the string and the number of operations.

The second line contains a string $S$ of length $n$. Every character of $S$ is either `N` or `H`.

Each of the next $T$ lines contains three integers $op_i,p_i$, and $k_i$ ($1\le op_i\le 4$, $1\le p_i\le n$, $0\le k_i\le 10^{18}$), describing the $i$-th operation.

## Output

Output one string of length $n$ — the final value of $S$ after all $T$ operations.

# N. Red Sequence

You are given a sequence of length $n$.

For each position $i$, there are between $1$ and $3$ chess pieces. The chess pieces have three possible colors: red, yellow, and blue.

It is guaranteed that there are no two chess pieces of the same color at the same position.

You need to divide the sequence into several continuous segments.

A continuous segment is called red if the number of red chess pieces in this segment is not less than the number of yellow chess pieces and is also not less than the number of blue chess pieces. More formally, for a segment:

$$
\text{red count}\ge\max(\text{yellow count},\text{blue count}).
$$

Your task is to maximize the sum of lengths of all red segments after the division. Output this maximum possible sum.

## Input

The first line contains an integer $n$ ($1\le n\le 10^6$).

The following $n$ lines describe the sequence. The $i$-th line contains three integers $r_i,y_i$, and $b_i$ ($0\le r_i,y_i,b_i\le 1$), where:

- $r_i=1$ means that the $i$-th position contains a red chess piece.
- $y_i=1$ means that it contains a yellow chess piece.
- $b_i=1$ means that it contains a blue chess piece.

It is guaranteed that $1\le r_i+y_i+b_i\le 3$ for every $i$.

## Output

Print one integer: the maximum possible sum of lengths of all red segments.

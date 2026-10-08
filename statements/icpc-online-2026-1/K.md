# K. Wolf Game

There are $n$ people standing in a row from left to right. Each person is either a villager or a werewolf.

Villagers always tell the truth. Werewolves may tell either the truth or a lie. It is also known that no two adjacent people are both werewolves.

The statement of the $i$-th person is described by a pair $(d_i,b_i)$:

- If $d_i=\texttt{L}$, the person says that there are exactly $b_i$ werewolves to their left.
- If $d_i=\texttt{R}$, the person says that there are exactly $b_i$ werewolves to their right.

For each test case, construct any possible assignment of people to villagers and werewolves, or determine that no such assignment exists.

## Input

The first line contains an integer $T$ ($1\le T\le 10^5$), the number of test cases.

Each test case consists of three lines. The first line contains an integer $n$ ($2\le n\le 5\cdot 10^5$). The second line contains a string $d$ of length $n$, consisting only of characters `L` and `R`. The third line contains $n$ integers $b_1,b_2,\ldots,b_n$ ($0\le b_i\le n$).

The sum of $n$ over all test cases does not exceed $5\cdot 10^5$.

## Output

For each test case, if there is no valid assignment, print `-1`.

Otherwise print a binary sequence of length $n$. The $i$-th value must be $0$ if the $i$-th person is a villager, and $1$ if the $i$-th person is a werewolf. You may print it either as one binary string or as $n$ space-separated integers.

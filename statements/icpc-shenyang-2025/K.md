# K. Relay Jump

There are $n$ frogs numbered $1$ through $n$, each initially located at an integer lattice point in the Cartesian plane. An external disturbance suddenly stimulates one of the frogs, triggering a chain reaction in which the frogs act according to the rules below.

When frog $i$ ($1 \le i \le n$) is *stimulated*, it can choose to either:

* jump toward some other frog $j$ ($1 \le j \le n$, $j \neq i$) and instantly land at the reflection of its current position across the point currently occupied by frog $j$ (if frog $i$ coincides with frog $j$ before the jump, then it lands at the coinciding point); immediately after this jump, frog $j$ becomes the next and only frog to be stimulated;
* or stay where it is, in which case all jumps end and no frog remains stimulated.

A frog may be stimulated multiple times at different moments, while some frogs may never be stimulated.

You observe that the first stimulated frog is numbered $s$, but there are too many jumps for you to capture the entire process. Fortunately, you recognize every frog, so you record both their initial positions $P_1, P_2, \ldots, P_n$ and their final positions $Q_1, Q_2, \ldots, Q_n$ after all jumps have ended. You also notice that all initial positions are **pairwise distinct**, and the final positions are **pairwise distinct** as well.

Let $t$ be the index of the last stimulated frog, i.e., the frog that chooses to stay still when stimulated, after which no more jumps occur. Please find $t$.

## Input

The first line contains two integers $n$ ($2 \le n \le 10^5$) and $s$ ($1 \le s \le n$), denoting the number of frogs and the index of the first stimulated frog, respectively.

The $i$-th of the next $n$ lines contains four integers $px_i$, $py_i$, $qx_i$, and $qy_i$ ($-10^9 \le px_i, py_i, qx_i, qy_i \le 10^9$), where $P_i = (px_i, py_i)$ and $Q_i = (qx_i, qy_i)$ represent the initial and final positions of frog $i$ in the plane.

It is guaranteed that all initial positions $P_1, P_2, \ldots, P_n$ are pairwise distinct. All final positions $Q_1, Q_2, \ldots, Q_n$ are pairwise distinct as well, and correspond to some sequence of at most $2 \times 10^5$ stimulations following the described rules.

## Output

Output a single integer $t$, denoting the index of the frog that was last stimulated.

## Note

In the sample case, the corresponding sequence of stimulations is $[1, 2, 3, 2, 1]$.

![](./images/icpc-shenyang-2025-K-aeca7406cb87264bfae9a27a940d5884a6d897e9.png)

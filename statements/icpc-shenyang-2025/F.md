# F. The Bond Beyond Time

Sulfox the fennec fox has built a maze and invited his two friends, Alice and Bob, to try it. The maze can be abstracted as a simple, connected undirected graph with $n$ vertices and $m$ edges, where Alice and Bob start at two distinct specified vertices.

Before any player moves, Sulfox must choose a direction for every undirected edge, turning the maze into a directed graph. Then, in an attempt to find each other, both players move in rounds within the oriented maze. In each round, they act simultaneously and independently, neither leaving marks nor communicating; rather, they adopt the "most brainless" strategy:

* If a player is currently at a vertex that has one or more outgoing edges, they arbitrarily traverse an outgoing edge to the adjacent vertex;
* otherwise, if their current vertex has no outgoing edges, they remain at that vertex.

Sulfox, being proud of his maze-design skills, wants to orient the passages so that Alice and Bob can never meet. Given the undirected graph and the starting vertices of Alice and Bob, please help Sulfox orient every edge so that no matter how Alice and Bob make their choices in every round, they will never occupy the same vertex at the end of any round. If such orientation does not exist, report it.

## Input

The first line of the input contains an integer $T$ ($1 \le T \le 1\,000$), denoting the number of test cases. For each test case:

The first line contains four integers $n$ ($2 \le n \le 300$), $m$ ($n - 1 \le m \le \frac{n (n - 1)}{2}$), $x$, and $y$ ($1 \le x, y \le n$, $x \neq y$), denoting the number of vertices and edges in the maze, and the starting vertices of Alice and Bob, respectively.

Each of the next $m$ lines contains two integers $u$ and $v$ ($1 \le u, v \le n$), describing an undirected edge connecting vertices $u$ and $v$. It is guaranteed that the given graph is connected and contains no self-loops or multiple edges.

It is guaranteed that there is at most $1$ test case with $n$ greater than $30$.

## Output

For each test case:

If it is possible to orient all edges so that Alice and Bob can never occupy the same vertex at the end of any round, print "Yes" (without quotes) in the first line.

Then output $m$ lines, each containing two integers $u'$ and $v'$ ($1 \le u', v' \le n$), describing a directed edge from $u'$ to $v'$. The unordered pair $(u', v')$ must correspond to an existing undirected edge in the input. The edges may be printed in any order.

If no valid orientation exists, output a single line containing "No" (without quotes).

## Note

For the first test case of the sample case, a valid orientation is illustrated as follows. In the first round, Alice must move from vertex $2$ to vertex $1$, while Bob must move from vertex $4$ to vertex $5$. After this round, both players are at vertices with no outgoing edges and will remain there forever, thus never meeting.

 ![](./images/icpc-shenyang-2025-F-2346857db37d89bef5f0ef2ff1742ce5a58e2f82.png) 

For the second test case of the sample case, a valid orientation is illustrated as follows. Both players are confined to the cycle $1 \to 2 \to 3 \to 4 \to 1$. Since they both advance one step along the cycle in each round, Alice will always remain one step behind Bob, thus never meeting.

 ![](./images/icpc-shenyang-2025-F-4a3cd27e4ae95589850ec39eb21baf208fd693f1.png) 

For the third test case of the sample case, with only one edge connecting the two vertices, directing it $1 \to 2$ forces Alice to move to Bob's vertex, whereas directing it $2 \to 1$ forces Bob to move to Alice's vertex. Since one player always joins the stationary player, a meeting is unavoidable regardless of the orientation.

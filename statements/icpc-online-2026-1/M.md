# M. Check In

In an ICPC contest, every participating team must first check in at the registration desk. You are asked to maintain the information system used for the sign-in process.

There is a roster containing the names of $n$ teams. All team names are pairwise distinct, and every name consists only of uppercase or lowercase English letters.

After the roster, there are $m$ queries. Each query gives a name (which also consists only of uppercase or lowercase English letters). For each query, you must classify it into exactly one of the following three outcomes:

- **Successful sign-in** — the name belongs to a valid team, and that team has not signed in before.
- **Not a valid team** — the name does not belong to any team in the roster.
- **Already signed in** — the name belongs to a valid team, but that team has already signed in earlier.

## Input

The first line contains two integers $n$ and $m$ ($1\le n,m\le 10^5$) — the number of teams in the roster and the number of queries.

The next $n$ lines each contain a team name. All team names are distinct.

The next $m$ lines each contain a query name.

Every name (both roster names and query names) consists only of uppercase or lowercase English letters. The total number of characters over all names (roster names and query names combined) does not exceed $10^6$.

## Output

For each of the $m$ queries, print one line containing exactly one of the following words:

- `OK` — if the query results in a successful sign-in.
- `WRONG` — if the name is not a valid team.
- `REPEAT` — if the name has already signed in.

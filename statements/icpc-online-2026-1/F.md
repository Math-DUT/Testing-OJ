# F. 50 Years of Excellence

The International Collegiate Programming Contest has inspired generations of students throughout fifty years of excellence.

Consider $n$ consecutive years. In each year, exactly $m$ problems are prepared, and every problem has an integer rating.

The score of a year is the sum of the ratings of all $m$ problems in that year. The score immediately before the first year is defined to be $0$.

A year is called excellent if its score is strictly less than the score of the previous year. This definition also applies to the first year, whose score is compared with $0$.

Determine how many years are excellent.

## Input

The first line contains two integers $n$ and $m$ ($1\le n\le 50$, $1\le m\le 13$) — the number of years and the number of problems in each year.

Each of the next $n$ lines contains $m$ integers $a_{i,1},a_{i,2},\ldots,a_{i,m}$ ($-1000\le a_{i,j}<0$) — the ratings of the problems in year $i$.

## Output

Print one integer — the number of excellent years.

## Note

In the first example, the scores of the five years are $-600,-550,-550,-500$, and $-650$. The first year is excellent because $-600<0$, and the fifth year is excellent because $-650<-500$. Equality is not sufficient, so the third year is not excellent.

In the second example, the scores are $-10,-11,-11$, and $-12$. The first, second, and fourth years are excellent.

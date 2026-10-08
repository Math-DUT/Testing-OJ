# I. A Lamp of Moon

Night unfolds across rivers and mountains, and moonlight falls upon the water like a lamp gently lifted in someone's hands.

Long ago, stargazers traced a vast lattice across the heavens. Every star was given its own position $(i,j)$, yet even stars that lie close together do not necessarily shine with the same light.

A star at $(i,j)$ may resonate with certain ancient celestial tracks. Whenever a prime divides both $i$ and $j$, the star is said to be in harmony with one such track. Beyond these resonances, every star also carries a glimmer of its own, one that will never fade. Thus, its radiance is $\omega(\gcd(i,j))+1$, where $\omega(x)$ denotes the number of distinct prime factors of $x$.

No one's eyes can hold the entire night sky in a single glance. Each time you look up, you can bear at most $L$ units of starlight. You begin with the lowest line of sight, at the star $(n,1)$, and slowly raise your gaze, encountering the stars in increasing order of their slope $j/i$. If several stars overlap along the same line of sight, the nearer one (i.e. the one with smaller $i$) is encountered first. You gather their light one by one, until the next star can no longer be seen in its entirety.

The night is vast and the stars are countless, yet gaze must finally come to rest somewhere. The last star that can be seen fully is the one I hold especially dear.

To the eye, it may be only a distant point of light. To me, however, it calls to mind someone who has left the familiar eaves behind and set out along a road of her own. She is not a destination waiting to be reached, but a traveler already on her way.

She has gone so far that the night has blurred her figure. Other stars lie along the same line of sight, overlapping in the distant sky, so I can no longer tell exactly where she is. All I can do is keep looking in her direction.

So I ask only this of you: tell me which direction I should look, namely the slope $j/i$ of the star.

## Formal Description

For a positive integer $x$, let $\omega(x)$ denote the number of distinct prime factors of $x$. In particular, $\omega(1)=0$.

You are given a positive integer $n$. Consider all integer points $(i,j)$ satisfying $1\le i,j\le n$. The weight of $(i,j)$ is $a_{i,j}=\omega(\gcd(i,j))+1$.

Sort these $n^2$ points by $j/i$ in increasing order. If two points have the same value of $j/i$, the point with smaller $i$ comes first. Denote the resulting sequence by $c_1,c_2,\ldots,c_{n^2}$.

Let $c_k=(i_k,j_k)$ and define the prefix weight sum

$$
S_k=\sum_{r=1}^{k}a_{i_r,j_r}.
$$

For each query, you are given a positive integer $L$. Let $k$ be the largest positive integer satisfying $S_k\le L$. If the total weight of all points is at most $L$, let $k=n^2$.

Output the slope $j_k/i_k$ of $c_k$. More precisely, output two coprime positive integers $p,q$ such that $p/q=j_k/i_k$.

It can be proved that the answer exists and is unique for every query.

## Input

The first line contains two positive integers $n$ ($1\le n\le 10^9$) and $T$ ($1\le T\le 5$).

The following $T$ lines each contain one positive integer $L$ ($1\le L\le 2\times 10^{18}$).

## Output

For each query, output one line containing two coprime positive integers $p,q$, representing the answer slope $p/q$.

## Note

$1\le n\le 10^9$, $1\le T\le 5$, $1\le L\le 2\times 10^{18}$.

Perhaps each of us is walking a road like hers.

At times, this mountain path is paved with disappointments known to no one and joys that last only for a moment. To keep moving forward is not to sever ourselves from the past, nor to abandon who we are today. The roads on which we lost our way, the nights during which we came to a halt, and the people who once walked beside us will all become part of the landscape, carried with us toward places farther away.

The road ahead may be long and difficult. There will still be nights when you cannot see the way, and moments when you wonder whether you can continue. Yet I hope you will not mistake a distant destination for proof that all your steps have been in vain. To have come this far is itself to have become a shining star; and those who are willing to look up once more will always find a new direction among the constellations.

**I offer you a lamp of moon, wishing all of you fair winds, however distant the mountains and long the road ahead.**

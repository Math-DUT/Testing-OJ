import sys
import itertools
read = sys.stdin.buffer.readline


def reply(p, m, v):
    b = [((x & m).bit_count() % 2) ^ (x == v) for x in p]
    return sum(x != y for x, y in zip(b, b[1:])) % 3


for _ in range(int(read())):
    n = int(read())
    k = (n - 1).bit_length()
    paths = [p for p in itertools.permutations(range(n)) if n == 1 or p[0] < p[-1]]
    while len(paths) > 1:
        best = None
        score = -1
        for m in range(1 << k):
            for v in range(-1, n):
                buckets = [0, 0, 0]
                for p in paths:
                    buckets[reply(p, m, v)] += 1
                s = len(paths) - max(buckets)
                if s > score:
                    score = s
                    best = (m, v)
        m, v = best
        print('?', m, v, flush=True)
        answer = int(read())
        paths = [p for p in paths if reply(p, m, v) == answer]
    print('!', *paths[0], flush=True)

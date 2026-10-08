# E. LCM Permutation

Construct a permutation $p_1,p_2,\ldots,p_n$ of length $n$ that satisfies

$$
\underset{1\le i\le n}{\operatorname{lcm}}\left(p_i+p_{(i\bmod n)+1}\right)\le 20n.
$$

## Input

The first line contains a positive integer $t$ ($1\le t\le 10^4$), representing the number of test cases. Each test case contains a single integer $n$ ($1\le n\le 8\cdot 10^6$), representing the length of the permutation.

It is guaranteed that the sum of $n$ over all test cases does not exceed $8\cdot 10^6$.

## Output

For each test case, output the permutation $p_1,p_2,\ldots,p_n$ that satisfies the condition.

It is guaranteed that at least one such permutation exists.

## Note

In the example, $\operatorname{lcm}(p_1+p_2,p_2+p_3,p_3+p_1)=\operatorname{lcm}(3,5,4)=60\le 20n$.

You can use the following code to speed up the output.

```cpp
#include <bits/stdc++.h>
using namespace std;

int ptr = 0; char buf[1 << 23];
inline void writeChar(char c) {
    if (ptr == 1 << 23) fwrite(buf, 1, ptr, stdout), ptr = 0;
    buf[ptr++] = c;
}
inline void writeInt(int x) {
    int t = 0; char s[10];
    while (x) s[t++] = (char)('0' + x % 10), x /= 10;
    while (t) writeChar(s[--t]);
}
inline void flushOut() {
    if (ptr) fwrite(buf, 1, ptr, stdout), ptr = 0;
}
int main() {
    // Your code here...
    flushOut();
    return 0;
}
```

# A. Recall

There is an initially empty stack $S$. A sequence of operations is then performed on it. There are three types of operations:

- `+ x` means pushing the element $x$ onto the stack.
- `? x` means querying whether the element $x$ exists in the stack. There are two possible results:
  - `T x` means that the element $x$ exists.
  - `F x` means that the element $x$ does not exist.
- `-` means popping the top element from the stack (the stack must be nonempty).

Little G recorded all `+ x`, `T x`, and `F x` operations during the entire process, but did not record any `-` operations.

Now, Little G wants to insert some `-` operations into the recorded operation sequence such that:

- At all times, all elements in the stack are distinct.
- The results of all `? x` queries are consistent with the operation sequence you construct.

It is guaranteed that at least one valid reconstructed sequence exists.

## Input

There are multiple test cases. The first line of the input contains an integer $T$ ($1\le T\le 10^5$), representing the number of test cases.

For each test case:

- The first line contains a positive integer $n$ ($1\le n\le 10^6$).
- Each of the next $n$ lines is in the form `+ x`, `T x`, or `F x`, representing a recorded operation. It is guaranteed that $1\le x\le 10^9$.

It is guaranteed that $1\le \sum n\le 10^6$.

## Output

For each test case, output one line containing a string consisting only of the characters `+`, `?`, and `-`, representing the operation sequence you reconstruct, where:

- If the $i$-th character is `+`, then the $i$-th operation in your reconstructed sequence pushes an element onto the stack.
- If the $i$-th character is `?`, then the $i$-th operation in your reconstructed sequence queries whether an element exists in the stack.
- If the $i$-th character is `-`, then the $i$-th operation in your reconstructed sequence pops the top element from the stack.

If there are multiple possible original operation sequences, you may reconstruct any one of them.

# B. Buggy Painting Software I

Sulfox the fennec fox is a coder who loves creating digital art in his spare time. Worn out from a day of debugging, he opens his painting software as usual, only to find the software itself is also riddled with bugs after the latest update, one major issue being that it stutters noticeably whenever he edits a pixel.

The painting software treats the canvas as an ordered stack of layers. Each layer is a grid of pixels with $n$ rows and $m$ columns, each pixel holding a *visible value* in $\{0,1,\ldots,nm\}$, where $0$ denotes transparent, and positive values are identifiers for $nm$ distinct colors. Since layers may occlude one another, at any position, the visible value of the composite image equals the visible value of the topmost non-transparent pixel among all layers; if all layers are transparent at that position, the visible value is $0$.

Sulfox already knows exactly what he wants to draw: a target image denoted by a matrix $(p_{i,j})_{n \times m}$ of visible values. To finish as quickly as possible, he wants to minimize the total "lag cost" caused by the software bug. Starting with no layers, Sulfox may perform the following operations any number of times:

* **Create Layer**: insert a new layer on top for free and initialize it either as a constant color layer with every pixel set to the same chosen color $c$ ($1 \le c \le nm$), or as an empty layer with every pixel transparent;
* **Brush Tool**: spend $a$ to set any single pixel of any layer to any chosen color $c$ ($1 \le c \le nm$);
* **Eraser Tool**: spend $b$ to make any single pixel of any layer transparent.

Help Sulfox determine the minimum total cost needed to perform operations so that the composite image matches the target image, i.e., the visible values at corresponding positions of both images are equal.

## Input

The first line of the input contains an integer $T$ ($1 \le T \le 10^5$), denoting the number of test cases. For each test case:

The first line contains four integers $n$, $m$ ($1 \le n, m \le 500$), $a$, and $b$ ($1 \le a, b \le 10^6$), denoting the image dimensions, the cost of using the Brush Tool, and the cost of using the Eraser Tool, respectively.

The $i$-th line of the next $n$ lines contains $m$ integers $p_{i,1}, p_{i,2}, \dots, p_{i,m}$ ($0 \le p_{i,j} \le nm$), where $p_{i,j}$ denotes the visible value of the target image at the $i$-th row and the $j$-th column.

It is guaranteed that the sum of $nm$ over all test cases does not exceed $10^6$.

## Output

For each test case, output one line containing an integer, representing the minimum total cost.

## Note

 ![](./images/icpc-shenyang-2025-B-b8487c148b4e73de6dd9fdd9451ef4de339538d6.png) 

For the first test case of the sample case, Sulfox can first create a layer with color $1$, and then spend $b = 2$ to make the pixel at the first row and the first column transparent.

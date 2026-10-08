#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using ld = long double;

struct Point {
    ll x, y;
};

struct FarthestSolver {
    const vector<Point>& p;
    int n;
    vector<int> best;

    FarthestSolver(const vector<Point>& p)
        : p(p), n((int)p.size()), best(n) {}

    ll dist2(int i, int j) const {
        ll dx = p[i].x - p[j].x;
        ll dy = p[i].y - p[j].y;
        // |dx| <= 2e9，|dy| <= 1e9，结果 <= 5e18。
        return dx * dx + dy * dy;
    }

    // 隐式完全单调矩阵。
    ll value(int i, int j) const {
        if (j <= i) return j - i;
        if (j >= i + n) return -1;
        return dist2(i, j < n ? j : j - n);
    }

    void smawk(const vector<int>& rows, const vector<int>& cols) {
        if (rows.empty()) return;

        // 删除无用列，保留列数不超过行数。
        vector<int> reduced;
        reduced.reserve(min(rows.size(), cols.size()));

        for (int c : cols) {
            while (!reduced.empty()) {
                int r = rows[reduced.size() - 1];
                if (value(r, c) > value(r, reduced.back()))
                    reduced.pop_back();
                else
                    break;
            }
            if (reduced.size() < rows.size())
                reduced.push_back(c);
        }

        // 递归求奇数下标行。
        vector<int> odd;
        odd.reserve(rows.size() / 2);
        for (int i = 1; i < (int)rows.size(); i += 2)
            odd.push_back(rows[i]);

        smawk(odd, reduced);

        // 利用单调性求偶数下标行。
        int left = 0;
        for (int i = 0; i < (int)rows.size(); i += 2) {
            int right;

            if (i + 1 < (int)rows.size()) {
                right = left;
                while (reduced[right] != best[rows[i + 1]])
                    ++right;
            } else {
                right = (int)reduced.size() - 1;
            }

            int chosen = left;
            ll mx = value(rows[i], reduced[left]);

            for (int j = left + 1; j <= right; ++j) {
                ll cur = value(rows[i], reduced[j]);
                // 相等时保留最左侧列。
                if (cur > mx) {
                    mx = cur;
                    chosen = j;
                }
            }

            best[rows[i]] = reduced[chosen];
            left = right;
        }
    }

    vector<ll> solve() {
        vector<int> rows(n), cols(2 * n - 1);
        iota(rows.begin(), rows.end(), 0);
        iota(cols.begin(), cols.end(), 0);

        smawk(rows, cols);

        vector<ll> radius2(n);
        for (int i = 0; i < n; ++i)
            radius2[i] = dist2(i, best[i] % n);

        return radius2;
    }
};

struct Circle {
    ld c, r2, start;
};

// a.c < b.c；交点右侧，圆 b 的高度更大。
ld intersection(const Circle& a, const Circle& b) {
    return (a.c + b.c) / 2
         + (a.r2 - b.r2) / (2 * (b.c - a.c));
}

ld primitive(ld t, ld r, ld r2) {
    // 防止浮点误差导致 sqrt 或 asin 越界。
    t = max(-r, min(r, t));
    ld y = sqrtl(max((ld)0, r2 - t * t));
    ld z = max((ld)-1, min((ld)1, t / r));

    return (t * y + r2 * asinl(z)) / 2;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T;
    cin >> T;
    cout << fixed << setprecision(18);

    while (T--) {
        int n;
        cin >> n;

        vector<Point> p(n);
        for (auto& a : p)
            cin >> a.x >> a.y;

        vector<ll> radius2 = FarthestSolver(p).solve();

        // 将 A_1 的落地横坐标平移到 0。
        vector<ld> pos(n + 1, 0);
        for (int i = 0; i < n; ++i) {
            int j = (i + 1) % n;
            ld dx = (ld)p[i].x - p[j].x;
            ld dy = (ld)p[i].y - p[j].y;

            pos[i + 1] = pos[i] + sqrtl(dx * dx + dy * dy);
        }
        ld perimeter = pos[n];

        // 三个相邻周期的圆，圆心天然递增。
        vector<Circle> hull;
        hull.reserve(3 * n);

        for (int shift = -1; shift <= 1; ++shift) {
            for (int i = 0; i < n; ++i) {
                Circle cur{
                    pos[i] + shift * perimeter,
                    (ld)radius2[i],
                    0
                };

                ld start = -numeric_limits<ld>::infinity();

                while (!hull.empty()) {
                    start = intersection(hull.back(), cur);
                    if (start <= hull.back().start)
                        hull.pop_back();
                    else
                        break;
                }

                cur.start = hull.empty()
                          ? -numeric_limits<ld>::infinity()
                          : start;

                hull.push_back(cur);
            }
        }

        // 对 [0, P] 内的上包络积分。
        ld area = 0;

        for (int i = 0; i < (int)hull.size(); ++i) {
            ld left = max((ld)0, hull[i].start);
            ld right = perimeter;

            if (i + 1 < (int)hull.size())
                right = min(right, hull[i + 1].start);

            if (left >= right) continue;

            ld r = sqrtl(hull[i].r2);
            area += primitive(right - hull[i].c, r, hull[i].r2)
                  - primitive(left - hull[i].c, r, hull[i].r2);
        }

        cout << area / perimeter << '\n';
    }
}
"""Case 19, The Mayor's Cat: who could reach the letterbox at 4:00 pm?

Shortest paths over the village map, walking 80 m/min (any path) or
cycling 250 m/min (roads only).
"""
import heapq

ROADS = {("M", "S"): 400, ("S", "C"): 300, ("C", "P"): 500, ("M", "C"): 600, ("M", "L"): 800}
PATHS = {("F", "M"): 1500, ("F", "P"): 900, ("L", "S"): 700}

def dist(a, b, cycling):
    edges = dict(ROADS) if cycling else {**ROADS, **PATHS}
    g = {}
    for (x, y), d in edges.items():
        g.setdefault(x, []).append((y, d)); g.setdefault(y, []).append((x, d))
    best, q = {a: 0}, [(0, a)]
    while q:
        d, x = heapq.heappop(q)
        if x == b: return d
        for y, w in g.get(x, []):
            if d + w < best.get(y, 1e9):
                best[y] = d + w; heapq.heappush(q, (d + w, y))
    return float("inf")

def minutes(a, b, mode):
    return dist(a, b, mode == "bike") / (250 if mode == "bike" else 80)

# suspect: (last seen place, time in minutes after 3:00), (next seen place, time), modes they could use
SUSPECTS = {
    "ada":    (("S", 56), None,        ["walk"]),
    "bert":   (("P", 52), ("C", 63),   ["walk", "bike"]),
    "cora":   (("L", 51), None,        ["walk"]),
    "dawson": (("F", 48), ("F", 75),   ["walk"]),
}
DROP = 60  # 4:00 pm
can = []
for name, (before, after, modes) in SUSPECTS.items():
    for mode in modes:
        arrive = before[1] + minutes(before[0], "M", mode)
        ok = arrive <= DROP
        if after:
            ok = ok and DROP + minutes("M", after[0], mode) <= after[1]
        print(f"{name:7} {mode:4} reaches letterbox at 3:{arrive:05.2f} -> {'POSSIBLE' if ok else 'no'}")
        if ok: can.append((name, mode))
assert can == [("bert", "bike")], can
print("unique: bert, by bike")

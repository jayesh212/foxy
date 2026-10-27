"""Case 22, The Liars' Weekend: brute-force every card draw, library visitors and culprit.

Rules from the booklet: each person drew a Truth card (every statement true) or a
Lie card (every statement false); exactly two Lie cards were drawn; the will was
burned by someone who went into the library.
"""
from itertools import combinations, product

P = ["ambrose", "beatrice", "clement", "dulcie", "edgar"]
STATEMENTS = {
    "ambrose":  [lambda L, V, k: "clement" in L,
                 lambda L, V, k: "dulcie" not in V],
    "beatrice": [lambda L, V, k: k in L,
                 lambda L, V, k: "beatrice" not in V],
    "clement":  [lambda L, V, k: "beatrice" not in L,
                 lambda L, V, k: "dulcie" in V],
    "dulcie":   [lambda L, V, k: ("dulcie" in L) == ("edgar" in L),
                 lambda L, V, k: "dulcie" not in V],
    "edgar":    [lambda L, V, k: ("dulcie" in L) != ("edgar" in L),
                 lambda L, V, k: "ambrose" not in V],
}

def solutions(liars_count=2):
    for L in combinations(P, liars_count):
        L = set(L)
        for bits in product([0, 1], repeat=len(P)):
            V = {p for p, b in zip(P, bits) if b}
            for k in V:
                if all(all(s(L, V, k) == (p not in L) for s in STATEMENTS[p]) for p in P):
                    yield tuple(sorted(L)), k

sols = sorted(set(solutions()))
print("(liars, culprit):", sols)
assert len(sols) == 1 and sols[0][1] == "dulcie"
for n in range(0, 6):
    print(n, "liars ->", sorted(set(solutions(n))))

"""Case 15, The Blackout Dinner: the seating clues must give exactly one plan."""
from itertools import permutations

GUESTS = ["arthur", "beatrix", "cosmo", "dorothea", "ellis"]
def nxt(a, b):  # seats 1..6 round a table
    return (a - b) % 6 in (1, 5)

plans = []
for perm in permutations(range(2, 7)):
    s = dict(zip(GUESTS, perm)); s["vera"] = 1                      # clue 1
    if s["beatrix"] != 4: continue                                   # clue 2: opposite Vera
    if nxt(s["arthur"], s["ellis"]): continue                       # clue 3
    if not nxt(s["dorothea"], s["beatrix"]): continue                # clue 4
    if not nxt(s["cosmo"], s["vera"]): continue                      # clue 5
    if s["ellis"] % 2: continue                                     # clue 6
    if not s["arthur"] > s["dorothea"]: continue                     # clue 7
    plans.append(s)
for p in plans: print(sorted(p.items(), key=lambda kv: kv[1]))
assert len(plans) == 1
# the six clues without clue 7 leave two plans, which is why clue 7 exists

"""Case 13, The Gullrock Lamp: checks that exactly one keeper can be the saboteur.

Rules from the booklet: the three innocent people tell the whole truth; the
saboteur lies at least once; the saboteur was in the lamp room at 2:00.
"""
from itertools import product

PEOPLE = ["ansel", "bea", "cyrus", "delphine"]

def worlds():
    for culprit, A, B, C, D, ladder, drip, bunk_empty, past_window in product(
        PEOPLE,
        ["watch", "lamp"],               # Ansel 1-3 am
        ["bunk", "lamp"],                # Bea around 2 am
        ["shed", "lamp"],                # Cyrus 1-2:30 am
        ["kitchen", "bunk", "lamp"],     # Delphine 1-3 am
        [True, False],                   # boots on outside ladder ~2 am
        [True, False],                   # Cyrus's oilskin dripping at 2:30
        [True, False],                   # Bea's bunk empty at 2:30
        [True, False],                   # Bea passed kitchen window ~2 am
    ):
        pos = {"ansel": A, "bea": B, "cyrus": C, "delphine": D}
        # exactly the culprit is in the lamp room at 2:00
        if any((pos[p] == "lamp") != (p == culprit) for p in PEOPLE):
            continue
        # physical consistency
        if B == "bunk" and (bunk_empty or past_window):
            continue
        # a culprit who isn't Ansel reached the lamp by the outside ladder if Ansel guarded the stairs
        through_watch = culprit != "ansel" and not ladder
        if culprit != "ansel" and A == "watch" and not ladder:
            continue
        statements = {
            "ansel": [A == "watch" and not through_watch, ladder],
            "bea": [B == "bunk" and D == "bunk", drip],
            "cyrus": [C == "shed", bunk_empty],
            "delphine": [D == "kitchen", past_window],
        }
        ok = all(all(statements[p]) for p in PEOPLE if p != culprit) and not all(statements[culprit])
        if ok:
            yield culprit

found = sorted(set(worlds()))
print("possible saboteurs:", found)
assert found == ["bea"], found
print("unique: bea")

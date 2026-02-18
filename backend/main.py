from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
from typing import List, Dict, Optional, Any
import random
import math


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# basic level -> numeric score
score_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"]

# In-memory player stats store (ready to be replaced by DB)
player_stats = defaultdict(lambda: {"goals": 0, "assists": 0, "appearances": 0, "rating": 0.0})

# Common formations
formations = {
    "4-4-2": {"Goalkeeper": 1, "Defender": 4, "Midfielder": 4, "Forward": 2},
    "4-3-3": {"Goalkeeper": 1, "Defender": 4, "Midfielder": 3, "Forward": 3},
    "3-5-2": {"Goalkeeper": 1, "Defender": 3, "Midfielder": 5, "Forward": 2},
}


@app.get("/")
def home() -> Dict[str, str]:
    return {"message": "AI Football Team Builder API running"}


def parse_formation(formation_input: Any, team_size: int) -> Dict[str, int]:
    if isinstance(formation_input, dict):
        return formation_input
    if isinstance(formation_input, str):
        if formation_input in formations:
            return formations[formation_input]
        parts = [int(p) for p in formation_input.split("-") if p.isdigit()]
        if len(parts) == 3:
            d, m, f = parts
            return {"Goalkeeper": 1, "Defender": d, "Midfielder": m, "Forward": f}
    base = max(1, (team_size - 1) // 3)
    return {"Goalkeeper": 1, "Defender": base, "Midfielder": base, "Forward": team_size - 1 - 2 * base}


def player_rating(player: Dict[str, Any]) -> float:
    r = score_map.get(player.get("level", "Beginner"), 1)
    if "rating" in player:
        try:
            return float(player["rating"]) * 1.0
        except Exception:
            pass
    return float(r)


def fitness_formation(teams: List[List[Dict[str, Any]]]) -> float:
    score_penalty = 0.0
    pos_penalty = 0.0
    size_penalty = 0.0

    scores: List[float] = []
    team_sizes = [len(t) for t in teams]

    total_players = sum(team_sizes) if team_sizes else 0
    avg_team_size = total_players / len(teams) if teams else 0

    total_pos_counts = {pos: 0 for pos in positions}
    for team in teams:
        for p in team:
            total_pos_counts[p["position"]] += 1

    expected_pos = {pos: (total_pos_counts[pos] / len(teams) if teams else 0) for pos in positions}

    for team in teams:
        score = sum(score_map.get(p["level"], 1) for p in team)
        scores.append(score)

        counts = {pos: 0 for pos in positions}
        for p in team:
            counts[p["position"]] += 1

        if counts["Goalkeeper"] != 1:
            pos_penalty += abs(counts["Goalkeeper"] - 1) * 5

        for pos in positions:
            pos_penalty += abs(counts[pos] - expected_pos[pos])

        size_penalty += abs(len(team) - avg_team_size)

    avg_score = sum(scores) / len(scores) if scores else 0
    score_penalty = sum(abs(s - avg_score) for s in scores)

    return score_penalty + pos_penalty + size_penalty


def genetic_multi_split(players: List[Dict[str, Any]], team_count: int, generations: int = 300) -> Optional[List[List[Dict[str, Any]]]]:
    if not players:
        return [[] for _ in range(team_count)]

    best_teams: Optional[List[List[Dict[str, Any]]]] = None
    best_score = float("inf")

    for _ in range(generations):
        random.shuffle(players)
        teams: List[List[Dict[str, Any]]] = [[] for _ in range(team_count)]

        for i, p in enumerate(players):
            teams[i % team_count].append(p)

        f = fitness_formation(teams)

        if f < best_score:
            best_score = f
            best_teams = [t[:] for t in teams]

    return best_teams


# Helper math/stat functions
def logistic_prob(a: float, b: float, k: float = 1.0) -> float:
    # Use difference scaled by k, then logistic
    try:
        x = (a - b) / max(1.0, (a + b) / 2.0) * k
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if a < b else 1.0


def poisson_sample(lmbda: float) -> int:
    if lmbda <= 0:
        return 0
    L = math.exp(-lmbda)
    k = 0
    p = 1.0
    while p > L:
        k += 1
        p *= random.random()
        if k > 100:
            break
    return k - 1 if k > 0 else 0


def expected_goals(strA: float, strB: float, base: float = 1.0) -> float:
    if strA + strB <= 0:
        return base, base
    diff = strA - strB
    factor = 1.0 + (1.0 / (1.0 + math.exp(-diff / 2.0)) - 0.5)
    total = strA + strB
    ratioA = strA / total
    ratioB = strB / total

    lambdaA = max(0.05, base * factor * (1.5 * ratioA))
    lambdaB = max(0.05, base * (2.0 - factor) * (1.5 * ratioB))
    return lambdaA, lambdaB


def compute_team_strength(team: Dict[str, Any]) -> float:
    starters = team.get("starters", []) or team.get("players", [])
    # Subs removed: only consider starters for strength
    s = sum(player_rating(p) for p in starters)
    return s


def simulate_match(teamA: Dict[str, Any], teamB: Dict[str, Any], base: float = 1.0) -> Dict[str, Any]:
    strA = compute_team_strength(teamA)
    strB = compute_team_strength(teamB)
    probA = logistic_prob(strA, strB, k=3.0)
    probB = 1.0 - probA
    expA, _ = expected_goals(strA, strB, base=base)
    expB, _ = expected_goals(strB, strA, base=base)
    goalsA = poisson_sample(expA)
    goalsB = poisson_sample(expB)
    if probA > probB:
        pred = "A"
    elif probB > probA:
        pred = "B"
    else:
        pred = "Draw"
    result = {
        "predicted_winner": "TeamA" if pred == "A" else ("TeamB" if pred == "B" else "Draw"),
        "win_probability": {"teamA": probA, "teamB": probB},
        "expected_score": {"teamA": expA, "teamB": expB},
        "simulated_score": {"teamA": goalsA, "teamB": goalsB},
    }
    return result


def enforce_formation_and_build_teams(players: List[Dict[str, Any]], team_count: int, formation: Dict[str, int], team_size: int, subs: int = 0) -> List[Dict[str, Any]]:
    # Create buckets by position
    pool = players[:]
    random.shuffle(pool)
    by_pos = {pos: [p for p in pool if p.get("position") == pos] for pos in positions}

    teams: List[Dict[str, Any]] = []
    for _ in range(team_count):
        teams.append({"starters": []})

    # Assign goalkeepers first
    for t in range(team_count):
        if by_pos["Goalkeeper"]:
            teams[t]["starters"].append(by_pos["Goalkeeper"].pop())
        else:
            # fallback: pick any player
            for pos in ["Defender", "Midfielder", "Forward"]:
                if by_pos[pos]:
                    teams[t]["starters"].append(by_pos[pos].pop())
                    break

    # Assign outfield according to formation
    for pos in ["Defender", "Midfielder", "Forward"]:
        needed = formation.get(pos, 0)
        for t in range(team_count):
            for _ in range(needed):
                if by_pos[pos]:
                    teams[t]["starters"].append(by_pos[pos].pop())
                else:
                    # try to fill from other positions
                    picked = None
                    for ppos in positions:
                        if ppos == "Goalkeeper":
                            continue
                        if by_pos.get(ppos):
                            picked = by_pos[ppos].pop()
                            teams[t]["starters"].append(picked)
                            break
                    if not picked:
                        # no players left; break early
                        break

    # Collect remaining players (including any remaining goalkeepers)
    remaining = [p for lst in by_pos.values() for p in lst]
    # Sort remaining by level (Advanced first)
    level_order = {"Advanced": 3, "Intermediate": 2, "Beginner": 1}
    remaining.sort(key=lambda x: level_order.get(x.get("level"), 1), reverse=True)

    # Fill starters until all players are assigned. If teams exceed team_size, allow extras (no subs concept).
    for p in remaining:
        # prefer teams with fewer starters
        teams_sorted = sorted(teams, key=lambda t: len(t["starters"]))
        teams_sorted[0]["starters"].append(p)

    # Ensure each team has at least 1 goalkeeper; if not, try to move one
    for i, t in enumerate(teams):
        if not any(pl.get("position") == "Goalkeeper" for pl in t["starters"]):
            for j, other in enumerate(teams):
                if i == j:
                    continue
                for pl in other["starters"]:
                    if pl.get("position") == "Goalkeeper":
                        other["starters"].remove(pl)
                        t["starters"].append(pl)
                        break
                if any(pl.get("position") == "Goalkeeper" for pl in t["starters"]):
                    break

    return teams


def create_schedule_list(teams: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    n = len(teams)
    schedule = []
    for i in range(n):
        for j in range(i + 1, n):
            schedule.append({"teamA": f"Team {i+1}", "teamB": f"Team {j+1}"})
    return schedule


def generate_knockout(teams):
    import random
    n = len(teams)

    # shuffle teams (random seeding)
    random.shuffle(teams)

    # next power of two
    pow2 = 1
    while pow2 < n:
        pow2 <<= 1

    # pad BYEs
    slots = teams + [None] * (pow2 - n)

    rounds = []
    match_id = 1

    # -------- Round 1 --------
    first_round = []
    for i in range(0, len(slots), 2):
        a = slots[i]
        b = slots[i + 1]

        # auto winner if BYE present
        if a is None:
            winner = b
        elif b is None:
            winner = a
        else:
            winner = None

        first_round.append({
            "matchId": match_id,
            "teamA": a,
            "teamB": b,
            "winner": winner
        })
        match_id += 1

    rounds.append(first_round)

    # -------- Next rounds --------
    prev_round = first_round
    while len(prev_round) > 1:
        next_round = []

        for i in range(0, len(prev_round), 2):
            left = prev_round[i]
            right = prev_round[i+1]

            next_round.append({
                "matchId": match_id,
                "teamA": f"Winner of Match {left['matchId']}",
                "teamB": f"Winner of Match {right['matchId']}",
                "winner": None
            })
            match_id += 1

        rounds.append(next_round)
        prev_round = next_round

    return rounds



@app.post("/generate")
async def generate(request: Request) -> Dict[str, Any]:
    data = await request.json()
    players = data.get("players", [])
    team_count = int(data.get("teamCount", 2))
    team_size = int(data.get("teamSize", max(5, len(players) // team_count)))
    # Formation is always treated as 'custom' (frontend no longer provides a selection)
    formation_input = "custom"
    # Subs are no longer provided by frontend and are not required.
    subs = 0
    tournament_type = data.get("tournamentType", "round-robin")

    formation = parse_formation(formation_input, team_size)

    teams_players = genetic_multi_split(players, team_count)
    if not teams_players or len(teams_players) != team_count:
        # fallback deterministic builder
        built = enforce_formation_and_build_teams(players, team_count, formation, team_size, subs)
        teams_players = [t["starters"] for t in built]

    teams_out = []
    for team_players in teams_players:
        captains = [p for p in team_players if p.get("captain")]
        if not captains and team_players:
            captain = max(team_players, key=lambda x: score_map.get(x.get("level"), 1))
            captain["captain"] = True
        teams_out.append({"players": team_players})

    schedule = []
    if team_count > 1:
        if tournament_type == "knockout":
            schedule = generate_knockout(teams_out)
        else:
            schedule = create_schedule_list(teams_out)

    return {"teams": teams_out, "schedule": schedule}



@app.post("/simulate")
async def simulate(request: Request) -> Dict[str, Any]:
    data = await request.json()
    # Accept either indices (teamA: 0) or full team objects
    teamA = data.get("teamA")
    teamB = data.get("teamB")

    # If teamA/teamB are indices (numbers or Team strings), try to resolve from provided teams list
    teams = data.get("teams") or []
    def resolve(t):
        if isinstance(t, int):
            return teams[t] if 0 <= t < len(teams) else {}
        if isinstance(t, str):
            m = None
            import re
            m = re.match(r"Team\s*(\d+)", t)
            if m:
                idx = int(m.group(1)) - 1
                return teams[idx] if 0 <= idx < len(teams) else {}
        if isinstance(t, dict):
            return t
        return {}

    # If a bracket/round/match provided, run simulation and advance winner into bracket
    bracket = data.get("bracket")
    round_idx = data.get("round")
    match_idx = data.get("match")

    if bracket is not None and round_idx is not None and match_idx is not None:
        # simulate the specified match
        try:
            # resolve the two teams from bracket strings or indices
            br = bracket
            # protect mutation by copying
            br_copy = [ [dict(m) for m in r] for r in br ]
            match = br_copy[round_idx][match_idx]
            a_val = match.get("teamA")
            b_val = match.get("teamB")
            a_obj = resolve(a_val)
            b_obj = resolve(b_val)
            res = simulate_match(a_obj or {}, b_obj or {})
            # determine winner label
            if res.get("predicted_winner") == "TeamA":
                winner_label = a_val
            elif res.get("predicted_winner") == "TeamB":
                winner_label = b_val
            else:
                # on draw choose higher probability or random
                winner_label = a_val if res.get("win_probability", {}).get("teamA", 0) >= res.get("win_probability", {}).get("teamB", 0) else b_val

            br_copy[round_idx][match_idx]["winner"] = winner_label

            # propagate to next round
            if round_idx + 1 < len(br_copy):
                tgt_idx = match_idx // 2
                tgt = br_copy[round_idx + 1][tgt_idx]
                if tgt.get("teamA") is None:
                    tgt["teamA"] = winner_label
                elif tgt.get("teamB") is None:
                    tgt["teamB"] = winner_label

            return {"result": res, "bracket": br_copy}
        except Exception as e:
            return {"error": str(e), "trace": traceback.format_exc()}

    a_obj = resolve(teamA)
    b_obj = resolve(teamB)
    result = simulate_match(a_obj, b_obj)
    return result

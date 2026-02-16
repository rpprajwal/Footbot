from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
import random
import math
import copy
import traceback

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
def home():
    return {"message": "AI Football Team Builder API running"}


def parse_formation(formation_input, team_size):
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


def player_rating(player):
    r = score_map.get(player.get("level", "Beginner"), 1)
    if "rating" in player:
        try:
            return float(player["rating"]) * 1.0
        except:
            pass
    return float(r)


def enforce_formation_and_build_teams(players, team_count, formation, team_size, subs):
    pool = players[:]
    random.shuffle(pool)
    by_pos = {pos: [p for p in pool if p.get("position") == pos] for pos in positions}
    teams = []
    for _ in range(team_count):
        teams.append({"starters": [], "subs": []})

    for t in range(team_count):
        if by_pos["Goalkeeper"]:
            teams[t]["starters"].append(by_pos["Goalkeeper"].pop())
        else:
            for pos in ["Defender", "Midfielder", "Forward"]:
                if by_pos[pos]:
                    teams[t]["starters"].append(by_pos[pos].pop())
                    break

    for pos in ["Defender", "Midfielder", "Forward"]:
        needed = formation.get(pos, 0)
        for t in range(team_count):
            for _ in range(needed):
                if by_pos[pos]:
                    teams[t]["starters"].append(by_pos[pos].pop())
                else:
                    picked = None
                    for ppos in positions:
                        if by_pos[ppos]:
                            # Tournament simulation endpoint removed. Use /predict-match for single match predictions.


def expected_goals(strA, strB, base=1.0):
    if strA + strB <= 0:
        return 0.5
    share = strA / (strA + strB)
    return max(0.1, base * (0.8 + share * 2.0))


def poisson_sample(lam):
    L = math.exp(-lam)
    k = 0
    p = 1.0
    while p > L:
        k += 1
        p *= random.random()
        if k > 50:
            break
    return k - 1 if k > 0 else 0


def compute_team_strength(team):
    starters = team.get("starters", [])
    subs = team.get("subs", [])
    s = sum(player_rating(p) for p in starters) + 0.6 * sum(player_rating(p) for p in subs)
    return s


def simulate_match(teamA, teamB):
    strA = compute_team_strength(teamA)
    strB = compute_team_strength(teamB)
    probA = logistic_prob(strA, strB, k=3.0)
    probB = 1.0 - probA
    expA = expected_goals(strA, strB, base=1.2)
    expB = expected_goals(strB, strA, base=1.2)
    goalsA = poisson_sample(expA)
    goalsB = poisson_sample(expB)
    pred = None
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
        "simulated_score": {"teamA": goalsA, "teamB": goalsB}
    }
    return result


def generate_round_robin(teams):
    n = len(teams)
    schedule = []
    for i in range(n):
        for j in range(i + 1, n):
            schedule.append({"teamA": i, "teamB": j})
    return schedule


def generate_knockout(teams):
    order = list(range(len(teams)))
    random.shuffle(order)
    pairs = []
    while len(order) > 1:
        a = order.pop()
        b = order.pop()
        pairs.append({"teamA": a, "teamB": b})
    if order:
        pairs.append({"teamA": order.pop(), "teamB": None})
    return pairs


@app.post("/generate")
async def generate(request: Request):
    try:
        data = await request.json()
        players = data.get("players", [])
        team_count = int(data.get("teamCount", 2))
        team_size = int(data.get("teamSize", max(5, len(players) // team_count)))
        formation_input = data.get("formation", "4-4-2")
        tournament_type = data.get("tournamentType", "round-robin")
        subs = int(data.get("subs", 3))
        formation = parse_formation(formation_input, team_size)
        teams = genetic_multi_split(players, team_count, formation, team_size, subs=subs)
        schedule = []
        if tournament_type == "round-robin":
            schedule = generate_round_robin(teams)
        elif tournament_type == "knockout":
            schedule = generate_knockout(teams)
        for t in teams:
            for p in t.get("players", []):
                name = p.get("name")
                player_stats[name]
        return {"teams": teams, "formation": formation, "schedule": schedule}
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


@app.post("/predict-match")
async def predict_match(request: Request):
    try:
        data = await request.json()
        teamA = data.get("teamA")
        teamB = data.get("teamB")
        if teamA is None or teamB is None:
            return {"error": "teamA and teamB required"}
        res = simulate_match(teamA, teamB)
        return res
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


@app.post("/simulate")
async def simulate_tournament(request: Request):
    try:
        data = await request.json()
        teams = data.get("teams", [])
        schedule = data.get("schedule", [])
        mode = data.get("mode", "round-robin")
        teams_state = copy.deepcopy(teams)
        results = []

        def apply_match_stats(tA_idx, tB_idx, scoreA, scoreB):
            if tA_idx is not None:
                for p in teams_state[tA_idx].get("players", []):
                    player_stats[p.get("name")]["appearances"] += 1
            if tB_idx is not None:
                for p in teams_state[tB_idx].get("players", []):
                    player_stats[p.get("name")]["appearances"] += 1
            for _ in range(scoreA):
                if teams_state[tA_idx]["players"]:
                    scorer = random.choice(teams_state[tA_idx]["players"])['name']
                    player_stats[scorer]["goals"] += 1
            for _ in range(scoreB):
                if teams_state[tB_idx]["players"]:
                    scorer = random.choice(teams_state[tB_idx]["players"])['name']
                    player_stats[scorer]["goals"] += 1

        if mode == "knockout":
            current_pairs = schedule[:]
            round_no = 1
            while current_pairs:
                next_round = []
                for pair in current_pairs:
                    a = pair.get("teamA")
                    b = pair.get("teamB")
                    if b is None:
                        winner = a
                        results.append({"round": round_no, "teamA": a, "teamB": b, "winner": a, "score": None})
                        next_round.append({"teamA": a, "teamB": None})
                        continue
                    sim = simulate_match(teams_state[a], teams_state[b])
                    scA = sim["simulated_score"]["teamA"]
                    scB = sim["simulated_score"]["teamB"]
                    winner = a if scA >= scB else b
                    results.append({"round": round_no, "teamA": a, "teamB": b, "winner": winner, "score": {"a": scA, "b": scB}, "prediction": sim})
                    apply_match_stats(a, b, scA, scB)
                    next_round.append({"teamA": winner, "teamB": None})
                paired = []
                buf = [p["teamA"] for p in next_round]
                while len(buf) > 1:
                    x = buf.pop()
                    y = buf.pop()
                    paired.append({"teamA": x, "teamB": y})
                if buf:
                    paired.append({"teamA": buf.pop(), "teamB": None})
                current_pairs = paired
                round_no += 1
        else:
            for match in schedule:
                a = match.get("teamA")
                b = match.get("teamB")
                sim = simulate_match(teams_state[a], teams_state[b])
                scA = sim["simulated_score"]["teamA"]
                scB = sim["simulated_score"]["teamB"]
                results.append({"teamA": a, "teamB": b, "score": {"a": scA, "b": scB}, "prediction": sim})
                apply_match_stats(a, b, scA, scB)

        scorers = sorted(player_stats.items(), key=lambda kv: kv[1].get("goals", 0), reverse=True)
        performers = sorted(player_stats.items(), key=lambda kv: kv[1].get("rating", 0.0), reverse=True)
        team_strengths = [(i, compute_team_strength(teams_state[i])) for i in range(len(teams_state))]
        team_strengths.sort(key=lambda x: x[1], reverse=True)
        return {"results": results, "leaderboard": {"top_scorers": scorers[:10], "best_performers": performers[:10], "team_strengths": team_strengths}}
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


@app.get("/leaderboard")
def get_leaderboard():
    scorers = sorted(player_stats.items(), key=lambda kv: kv[1].get("goals", 0), reverse=True)
    performers = sorted(player_stats.items(), key=lambda kv: kv[1].get("rating", 0.0), reverse=True)
    return {"top_scorers": scorers[:10], "best_performers": performers[:10]}

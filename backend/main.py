from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

score_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
def create_schedule(teams):
    schedule = []

    n = len(teams)

    for i in range(n):
        for j in range(i + 1, n):
            match = {
                "teamA": f"Team {i+1}",
                "teamB": f"Team {j+1}"
            }
            schedule.append(match)

    return schedule


@app.get("/")
def home():
    return {"message": "AI Football Team Builder API running"}



positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"]

def fitness_formation(teams):

    score_penalty = 0
    pos_penalty = 0
    size_penalty = 0

    scores = []
    team_sizes = [len(t) for t in teams]

    # average expected position count per team
    total_players = sum(team_sizes)
    avg_team_size = total_players / len(teams)

    # count total players per position across all teams
    total_pos_counts = {pos: 0 for pos in positions}
    for team in teams:
        for p in team:
            total_pos_counts[p["position"]] += 1

    expected_pos = {
        pos: total_pos_counts[pos] / len(teams)
        for pos in positions
    }

    for team in teams:

        score = sum(score_map[p["level"]] for p in team)
        scores.append(score)

        counts = {pos: 0 for pos in positions}
        for p in team:
            counts[p["position"]] += 1

        # goalkeeper constraint
        if counts["Goalkeeper"] != 1:
            pos_penalty += abs(counts["Goalkeeper"] - 1) * 5

        # positional balance penalty
        for pos in positions:
            pos_penalty += abs(counts[pos] - expected_pos[pos])

        # team size balance penalty
        size_penalty += abs(len(team) - avg_team_size)

    avg_score = sum(scores) / len(scores)
    score_penalty = sum(abs(s - avg_score) for s in scores)

    return score_penalty + pos_penalty + size_penalty

def genetic_multi_split(players, team_count, generations=300):

    best_teams = None
    best_score = 999999

    for _ in range(generations):

        random.shuffle(players)
        teams = [[] for _ in range(team_count)]

        for i, p in enumerate(players):
            teams[i % team_count].append(p)

        f = fitness_formation(teams)

        if f < best_score:
            best_score = f
            best_teams = [t[:] for t in teams]

    return best_teams


@app.post("/generate")
def generate(data: dict):

    players = data["players"]
    team_count = data.get("teamCount", 2)

    teams_players = genetic_multi_split(players, team_count)

    teams = []

    for team_players in teams_players:

        # assign captain if not selected
        captains = [p for p in team_players if p.get("captain")]

        if not captains and team_players:
            captain = max(team_players, key=lambda x: score_map[x["level"]])
            captain["captain"] = True

        teams.append({"players": team_players})

    # ---------- MATCH SCHEDULE ----------
    schedule = []
    if team_count > 2:
        for i in range(team_count):
            for j in range(i + 1, team_count):
                schedule.append({
                    "teamA": f"Team {i+1}",
                    "teamB": f"Team {j+1}"
                })

    return {
        "teams": teams,
        "schedule": schedule
    }

    

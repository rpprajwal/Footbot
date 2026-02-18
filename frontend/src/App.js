import React, { useState } from "react";
import PlayerForm from "./components/PlayerForm";
import PlayerList from "./components/PlayerList";
import TeamDisplay from "./components/TeamDisplay";
import ScheduleDisplay from "./components/ScheduleDisplay";

export default function App() {

  const [players, setPlayers] = useState([]);
  const PROD_API = process.env.REACT_APP_API_URL || "https://footbot-i58t.onrender.com";
  const API_BASE = PROD_API;
  const [teams, setTeams] = useState(null);
  const [namesConfirmed, setNamesConfirmed] = useState(false);
  const [schedule, setSchedule] = useState([]);   // NEW
  const [editingIndex, setEditingIndex] = useState(null);

  const [teamCount, setTeamCount] = useState(2);
  /*const [teamSize, setTeamSize] = useState(5);*/
  const [tournamentType, setTournamentType] = useState("round-robin");

  const resetTeams = () => {
    setTeams(null);
    setPlayers([]);
    setEditingIndex(null);
    setSchedule([]);   // NEW
    setNamesConfirmed(false);
  };

  // ---------------- ADD PLAYER ----------------
  const addPlayer = (player) => {
    setPlayers([...players, player]);
  };

  // ---------------- DELETE PLAYER ----------------
  const deletePlayer = (index) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  // ---------------- EDIT PLAYER ----------------
  const editPlayer = (index) => {
    setEditingIndex(index);
  };

  const updatePlayer = (player) => {
    const newPlayers = [...players];
    newPlayers[editingIndex] = player;
    setPlayers(newPlayers);
    setEditingIndex(null);
  };

  // ---------------- GENERATE TEAMS ----------------
  const generateScheduleFromTeams = (teams) => {
    if (!teams || teams.length < 2) return [];
    const schedule = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        schedule.push({ teamA: i, teamB: j });
      }
    }
    return schedule;
  };

  const generateTeams = async () => {
    const res = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        players,
        teamCount,
        //teamSize,
        tournamentType
      }),
    });

    const data = await res.json();

    // ensure each team has a name field to be filled in by user
    setTeams((data.teams || []).map((t) => ({ ...t, name: (t.name || "").trim() })));
    setNamesConfirmed(false);
    if (data.schedule && data.schedule.length) {
      setSchedule(data.schedule);
    } else {
      // create a simple round-robin schedule locally if backend didn't return one
      const auto = generateScheduleFromTeams(data.teams);
      setSchedule(auto);
    }
  };

  // Simulation removed: frontend no longer triggers tournament simulations
  // Visual simulation renderer removed — restoring simple JSON output

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">AI Football Team Builder</h1>
        <p className="text-sm text-gray-600">Quickly create balanced teams and a match schedule.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2">
          <span className="text-sm">Teams</span>
          <input
            className="w-20 p-2 border rounded"
            type="number"
            value={teamCount}
            min={2}
            onChange={(e) => setTeamCount(Number(e.target.value))}
          />
        </label>

        {/* <label className="flex items-center gap-2">
          <span className="text-sm">Team Size</span>
          <input
            className="w-20 p-2 border rounded"
            type="number"
            value={teamSize}
            min={1}
            onChange={(e) => setTeamSize(Number(e.target.value))}
          />
        </label> */}

        <div className="ml-auto flex gap-2">
          <button onClick={generateTeams} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Generate AI Teams</button>
          <button onClick={resetTeams} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">New Match / Reset</button>
        </div>
      </div>

      <div className="flex gap-3 items-center mb-4">
        <label className="flex items-center gap-2">
          <span className="text-sm">Tournament</span>
          <select className="p-2 border rounded" value={tournamentType} onChange={(e) => setTournamentType(e.target.value)}>
            <option value="round-robin">Round-robin</option>
            <option value="knockout">Knockout</option>
          </select>
        </label>

        {/* Subs removed: not necessary */}

        <div className="ml-auto" />
      </div>

      <PlayerForm
        addPlayer={addPlayer}
        updatePlayer={updatePlayer}
        editingIndex={editingIndex}
        players={players}
      />

      <PlayerList
        players={players}
        deletePlayer={deletePlayer}
        editPlayer={editPlayer}
      />

      {/* TEAM NAMES: require user to enter names after teams are generated */}
      {teams && !namesConfirmed && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3">Enter team names</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-24">Team {idx + 1}:</div>
                <input
                  className="flex-1 p-2 border rounded"
                  value={t.name || ""}
                  placeholder={`Team ${idx + 1} name`}
                  onChange={(e) => {
                    const newTeams = teams.map((tt, j) => j === idx ? { ...tt, name: e.target.value } : tt);
                    setTeams(newTeams);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                // require non-empty trimmed names
                const trimmed = teams.map((t) => ({ ...t, name: (t.name || "").trim() }));
                const anyEmpty = trimmed.some((t) => !t.name);
                if (anyEmpty) return alert('Please enter a name for every team');
                setTeams(trimmed);
                // update schedule entries: keep indices, ScheduleDisplay will resolve names
                setNamesConfirmed(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >Confirm Names</button>
          </div>
        </div>
      )}

      {/* GENERATED TEAMS */}
      {teams && <TeamDisplay teams={teams} />}

      {/* MATCH SCHEDULE */}
      {namesConfirmed && schedule && schedule.length > 0 && (
        <ScheduleDisplay schedule={schedule} teams={teams} API_BASE={API_BASE} tournamentType={tournamentType} />
      )}

      {/* Tournament simulation removed; no local results displayed */}
    </div>
  );
}

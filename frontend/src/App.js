import React, { useState } from "react";
import PlayerForm from "./components/PlayerForm";
import PlayerList from "./components/PlayerList";
import TeamDisplay from "./components/TeamDisplay";
import ScheduleDisplay from "./components/ScheduleDisplay";

export default function App() {

  const [players, setPlayers] = useState([]);
  const PROD_API = process.env.REACT_APP_API_URL || "https://footbot-i58t.onrender.com";
  const TEST_API = process.env.REACT_APP_API_TEST_URL || "http://127.0.0.1:8000";
  const [useTestApi, setUseTestApi] = useState(() => {
    const stored = localStorage.getItem("useTestApi");
    if (stored !== null) return stored === "true";
    return process.env.REACT_APP_USE_TEST === "true";
  });
  const API_BASE = useTestApi ? TEST_API : PROD_API;
  const [teams, setTeams] = useState(null);
  const [schedule, setSchedule] = useState([]);   // NEW
  const [editingIndex, setEditingIndex] = useState(null);

  const [teamCount, setTeamCount] = useState(2);
  /*const [teamSize, setTeamSize] = useState(5);*/
  const [formation, setFormation] = useState("4-4-2");
  const [tournamentType, setTournamentType] = useState("round-robin");
  const [subs, setSubs] = useState(3);

  const resetTeams = () => {
    setTeams(null);
    setPlayers([]);
    setEditingIndex(null);
    setSchedule([]);   // NEW
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
        formation,
        tournamentType,
        subs
      }),
    });

    const data = await res.json();

    setTeams(data.teams);
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
          <span className="text-sm">API</span>
          <select
            className="p-2 border rounded"
            value={useTestApi ? "test" : "prod"}
            onChange={(e) => {
              const val = e.target.value === "test";
              setUseTestApi(val);
              try { localStorage.setItem("useTestApi", val); } catch (err) {}
            }}
          >
            <option value="prod">Production</option>
            <option value="test">Testing</option>
          </select>
        </label>
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
          <span className="text-sm">Formation</span>
          <select className="p-2 border rounded" value={formation} onChange={(e) => setFormation(e.target.value)}>
            <option>4-4-2</option>
            <option>4-3-3</option>
            <option>3-5-2</option>
            <option>Custom</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm">Tournament</span>
          <select className="p-2 border rounded" value={tournamentType} onChange={(e) => setTournamentType(e.target.value)}>
            <option value="round-robin">Round-robin</option>
            <option value="knockout">Knockout</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm">Subs</span>
          <input className="w-20 p-2 border rounded" type="number" value={subs} min={0} onChange={(e) => setSubs(Number(e.target.value))} />
        </label>

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

      {/* GENERATED TEAMS */}
      {teams && <TeamDisplay teams={teams} />}

      {/* MATCH SCHEDULE */}
      {schedule && schedule.length > 0 && (
        <ScheduleDisplay schedule={schedule} teams={teams} />
      )}

      {/* Tournament simulation removed; no local results displayed */}
    </div>
  );
}

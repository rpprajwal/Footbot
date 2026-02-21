import React, { useState } from "react";
import PlayerForm from "./components/PlayerForm";
import PlayerList from "./components/PlayerList";
import TeamDisplay from "./components/TeamDisplay";
import ScheduleDisplay from "./components/ScheduleDisplay";
import Toast from "./components/Toast";
import Modal from "./components/Modal";

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

  const [toast, setToast] = useState({ message: "", type: "info" });
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const [selectedPlayer, setSelectedPlayer] = useState(null);

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

  const showDetails = (index) => {
    setSelectedPlayer(players[index]);
  };

  const closeDetails = () => setSelectedPlayer(null);

  const reorderPlayers = (from, to) => {
    const list = [...players];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setPlayers(list);
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
    <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 relative overflow-hidden z-10">

      {/* Decorative field background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.03)_0%,transparent_60%)] -z-10 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] -z-10 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-block relative">
            <h1 className="text-5xl sm:text-7xl font-display text-white tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(0,255,102,0.5)]">
              TEAM<span className="text-neon-green">BUILDER</span>
            </h1>
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-neon-green to-transparent"></div>
          </div>
          <p className="text-lg text-slate-400 mt-4 font-body font-light">Create perfectly balanced football squads with precision AI</p>
        </header>

        {/* CONTROLS DASHBOARD */}
        <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-neon-green"></div>

          <div className="flex flex-wrap items-center justify-center gap-6 w-full md:w-auto">
            <label className="flex flex-col gap-1 w-24">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Teams</span>
              <input
                className="glass-input text-center text-xl font-display font-medium"
                type="number"
                value={teamCount}
                min={2}
                onChange={(e) => setTeamCount(Number(e.target.value))}
              />
            </label>

            <label className="flex flex-col gap-1 w-40">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tournament</span>
              <select
                className="glass-input text-lg cursor-pointer"
                value={tournamentType}
                onChange={(e) => setTournamentType(e.target.value)}
              >
                <option value="round-robin" className="bg-pitch-dark text-white">Round-robin</option>
                <option value="knockout" className="bg-pitch-dark text-white">Knockout</option>
              </select>
            </label>
          </div>

          <div className="flex gap-4 w-full md:w-auto justify-center">
            <button onClick={resetTeams} className="btn-secondary whitespace-nowrap">
              Reset
            </button>
            <button onClick={generateTeams} className="btn-primary whitespace-nowrap flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Auto-Build
            </button>
          </div>
        </div>



        <PlayerForm
          addPlayer={addPlayer}
          updatePlayer={updatePlayer}
          editingIndex={editingIndex}
          players={players}
          showToast={showToast}
        />

        <PlayerList
          players={players}
          deletePlayer={deletePlayer}
          editPlayer={editPlayer}
          reorderPlayers={reorderPlayers}
          showDetails={showDetails}
          showToast={showToast}
        />

        {/* TEAM NAMES: require user to enter names after teams are generated */}
        {teams && !namesConfirmed && (
          <div className="mt-8 mb-8 glass-panel p-6 border-l-4 border-l-neon-green">
            <h3 className="text-2xl font-display text-white mb-6 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green"></span>
              Name Your Squads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((t, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Squad {idx + 1}</label>
                  <input
                    className="glass-input text-lg"
                    value={t.name || ""}
                    placeholder={`e.g., FC ${idx + 1}`}
                    onChange={(e) => {
                      const newTeams = teams.map((tt, j) => j === idx ? { ...tt, name: e.target.value } : tt);
                      setTeams(newTeams);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  const trimmed = teams.map((t) => ({ ...t, name: (t.name || "").trim() }));
                  const anyEmpty = trimmed.some((t) => !t.name);
                  if (anyEmpty) return alert('Please enter a name for every team');
                  setTeams(trimmed);
                  setNamesConfirmed(true);
                }}
                className="btn-primary"
              >Confirm Squad Names</button>
            </div>
          </div>
        )}

        {/* GENERATED TEAMS */}
        {teams && <TeamDisplay teams={teams} />}

        <Modal open={!!selectedPlayer} title={selectedPlayer ? selectedPlayer.name : ""} onClose={closeDetails}>
          {selectedPlayer && (
            <div className="space-y-4 p-2">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <strong className="text-slate-300">Position</strong>
                <span className="bg-pitch-light px-3 py-1 rounded-md text-neon-green font-bold">{selectedPlayer.position}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <strong className="text-slate-300">Level</strong>
                <span className="font-display text-xl text-white">{selectedPlayer.level}</span>
              </div>
              {selectedPlayer.captain && (
                <div className="flex items-center justify-center gap-2 mt-4 text-yellow-500 font-bold bg-yellow-500/10 py-3 rounded-lg border border-yellow-500/20">
                  ⭐ Team Captain
                </div>
              )}
            </div>
          )}
        </Modal>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />

        {/* MATCH SCHEDULE */}
        {namesConfirmed && schedule && schedule.length > 0 && (
          <ScheduleDisplay schedule={schedule} teams={teams} API_BASE={API_BASE} tournamentType={tournamentType} />
        )}

        {/* Tournament simulation removed; no local results displayed */}
      </div>
    </div>
  );
}

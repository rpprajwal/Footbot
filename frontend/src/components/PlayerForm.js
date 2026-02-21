import React, { useState, useEffect } from "react";

export default function PlayerForm({ addPlayer, updatePlayer, editingIndex, players, showToast }) {

  const [name, setName] = useState("");
  const [position, setPosition] = useState("Forward");
  const [level, setLevel] = useState("Beginner");
  const [captain, setCaptain] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingIndex !== null) {
      const p = players[editingIndex];
      setName(p.name);
      setPosition(p.position);
      setLevel(p.level);
      setCaptain(p.captain || false);
    }
  }, [editingIndex, players]);

  const submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }

    const player = { name: trimmed, position, level, captain };

    if (editingIndex !== null) {
      updatePlayer(player);
      showToast && showToast("Player updated", "success");
    } else {
      addPlayer(player);
      showToast && showToast("Player added", "success");
    }

    setName("");
    setCaptain(false);
    setError("");
  };

  return (
    <form onSubmit={submit} className="mb-8 glass-panel p-6 transition-all hover:shadow-2xl hover:shadow-neon-green/10">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <label className="flex flex-col gap-1 flex-1 w-full">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold ml-1">Player Name</span>
          <input
            className="glass-input"
            placeholder="e.g. Lionel Messi"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error && e.target.value.trim()) setError("");
            }}
          />
        </label>

        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold ml-1">Position</span>
          <select className="glass-input cursor-pointer" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option className="bg-pitch-dark text-white">Forward</option>
            <option className="bg-pitch-dark text-white">Midfielder</option>
            <option className="bg-pitch-dark text-white">Defender</option>
            <option className="bg-pitch-dark text-white">Goalkeeper</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold ml-1">Level</span>
          <select className="glass-input cursor-pointer" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option className="bg-pitch-dark text-white">Beginner</option>
            <option className="bg-pitch-dark text-white">Intermediate</option>
            <option className="bg-pitch-dark text-white">Advanced</option>
          </select>
        </label>

        <label className="flex flex-col items-center justify-center gap-1 cursor-pointer w-full sm:w-20">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Captain</span>
          <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${captain ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>
            <input
              type="checkbox"
              className="hidden"
              checked={captain}
              onChange={(e) => setCaptain(e.target.checked)}
            />
            <span className="text-xl leading-none">C</span>
          </div>
        </label>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          {editingIndex !== null ? "Update" : "Add Player"}
        </button>
      </div>
      {error && <div className="w-full text-red-600 text-sm mt-2">{error}</div>}
    </form>
  );
}

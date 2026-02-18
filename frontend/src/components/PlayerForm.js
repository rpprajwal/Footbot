import React, { useState, useEffect } from "react";

export default function PlayerForm({ addPlayer, updatePlayer, editingIndex, players }) {

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

  const submit = () => {

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }

    const player = { name: trimmed, position, level, captain };

    if (editingIndex !== null) {
      updatePlayer(player);
    } else {
      addPlayer(player);
    }

    setName("");
    setCaptain(false);
    setError("");
  };

  return (
    <div className="mb-6 bg-white p-4 rounded shadow">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[160px] p-2 border rounded"
          placeholder="Player name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error && e.target.value.trim()) setError("");
          }}
        />

        <select className="p-2 border rounded" value={position} onChange={(e) => setPosition(e.target.value)}>
          <option>Forward</option>
          <option>Midfielder</option>
          <option>Defender</option>
          <option>Goalkeeper</option>
        </select>

        <select className="p-2 border rounded" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>

        <label className="flex items-center gap-2 ml-2">
          <input
            type="checkbox"
            checked={captain}
            onChange={(e) => setCaptain(e.target.checked)}
          />
          <span className="text-sm">Captain</span>
        </label>

        <button onClick={submit} className="ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {editingIndex !== null ? "Update Player" : "Add Player"}
        </button>
      </div>
      {error && <div className="w-full text-red-600 text-sm mt-2">{error}</div>}
    </div>
  );
}

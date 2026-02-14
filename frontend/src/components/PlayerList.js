import React from "react";

export default function PlayerList({ players, deletePlayer, editPlayer }) {

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Players</h3>
      <div className="space-y-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">{p.position} • {p.level} {p.captain && "• Captain"}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => editPlayer(i)} className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>
              <button onClick={() => deletePlayer(i)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

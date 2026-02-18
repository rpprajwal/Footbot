import React from "react";

export default function TeamDisplay({ teams }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {teams.map((team, idx) => (
        <div key={idx} className="border rounded bg-white p-4">
          <h2 className="text-xl font-semibold mb-3">{team.name && team.name.trim() ? team.name : `Team ${idx + 1}`}</h2>
          <div className="space-y-2">
            {team.players.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.position}</div>
                </div>
                <div className="text-yellow-500">{p.captain && "⭐"}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

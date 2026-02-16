import React, { useState } from "react";

export default function ScheduleDisplay({ schedule, teams }) {
  const [open, setOpen] = useState({});

  const toggle = (i) => setOpen({ ...open, [i]: !open[i] });

  const getTeamByNameOrIndex = (val) => {
    if (!teams) return val;
    // support both names and indices
    if (typeof val === "number") {
      const t = teams[val];
      return t ? `Team ${val + 1}` : `Team ${val}`;
    }
    return val;
  };

  const resolveTeamObject = (val) => {
    if (!teams) return null;
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return teams[val] || null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      const m = val.match(/Team\s*(\d+)/i);
      if (m) {
        const idx = parseInt(m[1], 10) - 1;
        return teams[idx] || null;
      }
    }
    return null;
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Match Schedule</h2>
      <div className="space-y-3">
        {schedule.map((m, i) => (
          <div key={i} className="p-3 border rounded bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {getTeamByNameOrIndex(m.teamA)} vs {getTeamByNameOrIndex(m.teamB)}
              </div>
              <div className="flex items-center gap-2">
                {m.time && <div className="text-sm text-gray-500">{m.time}</div>}
                <button onClick={() => toggle(i)} className="text-sm text-blue-600">{open[i] ? "Hide" : "View"} roster</button>
              </div>
            </div>

            {open[i] && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">{getTeamByNameOrIndex(m.teamA)}</div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const tObj = resolveTeamObject(m.teamA);
                        return tObj && tObj.players && tObj.players.length ? (
                          tObj.players.map((p, idx) => (
                            <div key={idx}>{p.name} {p.captain && "⭐"}</div>
                          ))
                        ) : (
                          <div>No roster available</div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">{getTeamByNameOrIndex(m.teamB)}</div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const tObj = resolveTeamObject(m.teamB);
                        return tObj && tObj.players && tObj.players.length ? (
                          tObj.players.map((p, idx) => (
                            <div key={idx}>{p.name} {p.captain && "⭐"}</div>
                          ))
                        ) : (
                          <div>No roster available</div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from "react";

export default function ScheduleDisplay({ schedule, teams, API_BASE, tournamentType }) {
  const [open, setOpen] = useState({});
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState(Array.isArray(schedule) && schedule.length && Array.isArray(schedule[0]) ? schedule : null);

  const toggle = (i) => setOpen({ ...open, [i]: !open[i] });

  const getTeamByNameOrIndex = (val) => {
    if (!teams) return val;
    if (val === null || val === undefined) return "TBD";
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

  // If bracket present, render rounds; otherwise render flat schedule
  if (bracket) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Match Schedule {tournamentType === 'knockout' && <span className="ml-2 text-sm text-gray-500">(Knockout)</span>}</h2>
        <div className="space-y-3">
          {bracket.map((round, rIdx) => (
            <div key={rIdx} className="mb-4">
              <div className="text-sm font-semibold mb-2">Round {rIdx + 1}</div>
              {round.map((m, i) => (
                <div key={`${rIdx}-${i}`} className="p-3 border rounded bg-white mb-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{getTeamByNameOrIndex(m.teamA)} vs {getTeamByNameOrIndex(m.teamB)}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggle(`${rIdx}-${i}`)} className="text-sm text-blue-600">{open[`${rIdx}-${i}`] ? "Hide" : "View"} roster</button>
                      {API_BASE && (
                        <button
                          onClick={async () => {
                            try {
                              const resp = await fetch(`${API_BASE}/simulate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bracket, round: rIdx, match: i, teams })
                              });
                              const json = await resp.json();
                              if (json.bracket) setBracket(json.bracket);
                              setResults({ ...results, [`${rIdx}-${i}`]: json });
                            } catch (e) {
                              setResults({ ...results, [`${rIdx}-${i}`]: { error: e.message || String(e) } });
                            }
                          }}
                          className="text-sm text-green-600"
                        >Simulate</button>
                      )}
                    </div>
                  </div>

                  {results[`${rIdx}-${i}`] && (
                    <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(results[`${rIdx}-${i}`], null, 2)}</pre>
                    </div>
                  )}

                  {open[`${rIdx}-${i}`] && (
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
          ))}
        </div>
      </div>
    );
  }

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
                {API_BASE && (
                  <button
                    onClick={async () => {
                      // call simulate endpoint
                      try {
                        const resp = await fetch(`${API_BASE}/simulate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ teamA: m.teamA, teamB: m.teamB, teams })
                        });
                        const json = await resp.json();
                        setResults({ ...results, [i]: json });
                      } catch (e) {
                        setResults({ ...results, [i]: { error: e.message || String(e) } });
                      }
                    }}
                    className="text-sm text-green-600"
                  >
                    Simulate
                  </button>
                )}
              </div>
            </div>
            {results[i] && (
              <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                <pre className="whitespace-pre-wrap">{JSON.stringify(results[i], null, 2)}</pre>
              </div>
            )}

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

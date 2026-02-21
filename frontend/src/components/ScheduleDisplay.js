import React, { useState } from "react";

export default function ScheduleDisplay({ schedule, teams, API_BASE, tournamentType }) {
  const [open, setOpen] = useState({});
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState(Array.isArray(schedule) && schedule.length && Array.isArray(schedule[0]) ? schedule : null);

  const toggle = (i) => setOpen({ ...open, [i]: !open[i] });

  const renderSimulationResult = (data) => {
    if (data.error) {
      return <div className="text-red-500 font-bold mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">Error: {data.error}</div>;
    }
    const res = data.result || data;
    if (!res.predicted_winner) return null;

    const winProbA = (res.win_probability?.teamA * 100).toFixed(1);
    const winProbB = (res.win_probability?.teamB * 100).toFixed(1);
    const scoreA = res.simulated_score?.teamA ?? 0;
    const scoreB = res.simulated_score?.teamB ?? 0;
    const expA = (res.expected_score?.teamA ?? 0).toFixed(1);
    const expB = (res.expected_score?.teamB ?? 0).toFixed(1);

    return (
      <div className="mt-4 bg-pitch-base/50 p-4 rounded-xl border border-neon-green/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-2xl pointer-events-none"></div>
        <h4 className="text-neon-green font-display uppercase tracking-widest text-lg mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
          AI Match Simulation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center relative z-10">
          <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Sim Score</div>
            <div className="text-2xl font-display text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{scoreA} - {scoreB}</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Win Prob</div>
            <div className="text-lg font-display text-slate-200">{winProbA}% <span className="text-neon-green/50 text-sm">vs</span> {winProbB}%</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Expected (xG)</div>
            <div className="text-lg font-display text-slate-200">{expA} <span className="text-neon-green/50 text-sm">vs</span> {expB}</div>
          </div>
        </div>
      </div>
    );
  };

  const getTeamByNameOrIndex = (val) => {
    if (!teams) return val;
    if (val === null || val === undefined) return "BYE";
    if (typeof val === "number") {
      const t = teams[val];
      return t ? (t.name && t.name.trim() ? t.name : `Team ${val + 1}`) : `Team ${val}`;
    }
    if (typeof val === 'object') {
      return val.name || 'BYE';
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
      <div className="mt-12 mb-10">
        <h3 className="text-2xl font-display text-white mb-6 uppercase tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green"></span>
          Match Schedule {tournamentType === 'knockout' && <span className="text-slate-500 ml-2">Knockout Phase</span>}
        </h3>
        <div className="space-y-8 relative">
          {/* Vertical stem line for bracket feel */}
          <div className="absolute left-6 top-8 bottom-4 w-px bg-white/10 hidden md:block"></div>

          {bracket.map((round, rIdx) => (
            <div key={rIdx} className="mb-6 relative z-10">
              <div className="text-sm font-display uppercase tracking-widest text-neon-green mb-3 ml-2 md:ml-12 drop-shadow-md">
                Round {rIdx + 1}
              </div>
              {round.map((m, i) => (
                <div key={`${rIdx}-${i}`} className="glass-panel p-5 mb-4 border-t-0 border-r-0 border-b-0 border-l-4 border-l-slate-700 hover:border-l-neon-green transition-colors md:ml-12 group">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xl font-display text-white w-full md:w-auto justify-center md:justify-start">
                      <div className="text-right w-32 truncate">{getTeamByNameOrIndex(m.teamA)}</div>
                      <div className="text-xs bg-pitch-light/80 text-neon-green px-2 py-1 rounded font-body font-bold border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,102,0.1)]">VS</div>
                      <div className="text-left w-32 truncate">{getTeamByNameOrIndex(m.teamB)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(`${rIdx}-${i}`)} className="text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">{open[`${rIdx}-${i}`] ? "Hide Lineups" : "View Lineups"}</button>
                      {API_BASE && (
                        <button
                          onClick={async () => {
                            const matchKey = `${rIdx}-${i}`;
                            if (results[matchKey]) {
                              const newResults = { ...results };
                              delete newResults[matchKey];
                              setResults(newResults);
                              return;
                            }
                            try {
                              const resp = await fetch(`${API_BASE}/simulate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bracket, round: rIdx, match: i, teams })
                              });
                              const json = await resp.json();
                              if (json.bracket) setBracket(json.bracket);
                              setResults({ ...results, [matchKey]: json });
                            } catch (e) {
                              setResults({ ...results, [matchKey]: { error: e.message || String(e) } });
                            }
                          }}
                          className={`btn-secondary text-xs px-3 py-1.5 ${results[`${rIdx}-${i}`] ? 'bg-white/10 border-neon-green/50' : ''}`}
                        >
                          {results[`${rIdx}-${i}`] ? 'Hide Simulation' : 'Simulate Match'}
                        </button>
                      )}
                    </div>
                  </div>

                  {results[`${rIdx}-${i}`] && renderSimulationResult(results[`${rIdx}-${i}`])}

                  {open[`${rIdx}-${i}`] && (
                    <div className="mt-5 space-y-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-pitch-base/50 p-3 rounded-xl border border-white/5">
                          <div className="text-sm text-slate-300 font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-2">{getTeamByNameOrIndex(m.teamA)}</div>
                          <div className="text-sm text-slate-400 font-medium space-y-1.5">
                            {(() => {
                              const tObj = resolveTeamObject(m.teamA);
                              return tObj && tObj.players && tObj.players.length ? (
                                tObj.players.map((p, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                    {p.name} {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-bold px-1 py-0.5 rounded ml-1">C</span>}
                                  </div>
                                ))
                              ) : (
                                <div className="italic opacity-50">No lineup data</div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="bg-pitch-base/50 p-3 rounded-xl border border-white/5">
                          <div className="text-sm text-slate-300 font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-2 text-right md:text-left">{getTeamByNameOrIndex(m.teamB)}</div>
                          <div className="text-sm text-slate-400 font-medium space-y-1.5">
                            {(() => {
                              const tObj = resolveTeamObject(m.teamB);
                              return tObj && tObj.players && tObj.players.length ? (
                                tObj.players.map((p, idx) => (
                                  <div key={idx} className="flex items-center justify-end md:justify-start gap-2">
                                    {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-bold px-1 py-0.5 rounded mr-1">C</span>} {p.name}
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                  </div>
                                ))
                              ) : (
                                <div className="italic opacity-50 text-right md:text-left">No lineup data</div>
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
    <div className="mt-12 mb-10">
      <h3 className="text-2xl font-display text-white mb-6 uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon-green"></span>
        Match Schedule
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {schedule.map((m, i) => (
          <div key={i} className="glass-panel p-5 border-t-0 border-r-0 border-b-0 border-l-4 border-l-slate-700 hover:border-l-neon-green transition-colors group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xl font-display text-white w-full md:w-auto justify-center md:justify-start">
                <div className="text-right w-32 truncate">{getTeamByNameOrIndex(m.teamA)}</div>
                <div className="text-xs bg-pitch-light/80 text-neon-green px-2 py-1 rounded font-body font-bold border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,102,0.1)]">VS</div>
                <div className="text-left w-32 truncate">{getTeamByNameOrIndex(m.teamB)}</div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                {m.time && <div className="text-xs font-bold font-mono text-neon-green bg-black/30 px-2 py-1 rounded">{m.time}</div>}
                <button onClick={() => toggle(i)} className="text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">{open[i] ? "Hide Lineups" : "View Lineups"}</button>
                {API_BASE && (
                  <button
                    onClick={async () => {
                      if (results[i]) {
                        const newResults = { ...results };
                        delete newResults[i];
                        setResults(newResults);
                        return;
                      }
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
                    className={`btn-secondary text-xs px-3 py-1.5 ${results[i] ? 'bg-white/10 border-neon-green/50' : ''}`}
                  >
                    {results[i] ? 'Hide Simulation' : 'Simulate Match'}
                  </button>
                )}
              </div>
            </div>
            {results[i] && renderSimulationResult(results[i])}

            {open[i] && (
              <div className="mt-5 space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-pitch-base/50 p-3 rounded-xl border border-white/5">
                    <div className="text-sm text-slate-300 font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-2">{getTeamByNameOrIndex(m.teamA)}</div>
                    <div className="text-sm text-slate-400 font-medium space-y-1.5">
                      {(() => {
                        const tObj = resolveTeamObject(m.teamA);
                        return tObj && tObj.players && tObj.players.length ? (
                          tObj.players.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                              {p.name} {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-bold px-1 py-0.5 rounded ml-1">C</span>}
                            </div>
                          ))
                        ) : (
                          <div className="italic opacity-50">No lineup data</div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-pitch-base/50 p-3 rounded-xl border border-white/5">
                    <div className="text-sm text-slate-300 font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-2 text-right md:text-left">{getTeamByNameOrIndex(m.teamB)}</div>
                    <div className="text-sm text-slate-400 font-medium space-y-1.5">
                      {(() => {
                        const tObj = resolveTeamObject(m.teamB);
                        return tObj && tObj.players && tObj.players.length ? (
                          tObj.players.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-end md:justify-start gap-2">
                              {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-bold px-1 py-0.5 rounded mr-1">C</span>} {p.name}
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            </div>
                          ))
                        ) : (
                          <div className="italic opacity-50 text-right md:text-left">No lineup data</div>
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

import React from "react";

export default function TeamDisplay({ teams }) {
  return (
    <div className="mb-10">
      <h3 className="text-2xl font-display text-white mb-6 uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon-green"></span>
        Squad Lineups
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, idx) => (
          <div key={idx} className="glass-panel p-6 relative overflow-hidden group">
            {/* Background accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-green/5 rounded-full blur-2xl group-hover:bg-neon-green/10 transition-colors"></div>

            <h2 className="text-3xl font-display text-white mb-1 drop-shadow-md">
              {team.name && team.name.trim() ? team.name : `Squad ${idx + 1}`}
            </h2>
            <div className="w-12 h-1 bg-neon-green rounded mb-6"></div>

            <div className="space-y-3 relative z-10">
              {team.players.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pitch-light flex items-center justify-center text-xs font-bold text-white/50 border border-white/10">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200 text-lg flex items-center gap-2">
                        {p.name}
                        {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-yellow-500/20">C</span>}
                      </div>
                      <div className="text-xs uppercase tracking-wider font-bold text-neon-green/80 mt-0.5">{p.position}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useRef } from "react";

export default function PlayerList({ players, deletePlayer, editPlayer, reorderPlayers, showDetails, showToast }) {

  const dragIndex = useRef(null);
  const touchStartY = useRef(null);
  const touchCurrentIndex = useRef(null);

  // Desktop HTML5 Drag and Drop
  const onDragStart = (e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    const from = dragIndex.current;
    const to = index;
    if (from === null || from === undefined || from === to) return;
    reorderPlayers && reorderPlayers(from, to);
    showToast && showToast('Player order updated', 'success');
    dragIndex.current = null;
  };

  // Mobile Touch Drag Handle
  const onTouchStart = (e, index) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentIndex.current = index;
    document.body.style.overflow = 'hidden'; // Prevent scrolling while dragging
  };

  const onTouchMove = (e, index) => {
    if (touchCurrentIndex.current === null) return;
    e.preventDefault(); // Prevent default touch actions (like scrolling) on the element
  };

  const onTouchEnd = (e, index) => {
    if (touchCurrentIndex.current === null) return;
    document.body.style.overflow = ''; // Restore scrolling

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    // Estimate roughly 80px per card height to determine how many slots to move
    const slotsMoved = Math.round(deltaY / 80);

    if (slotsMoved !== 0) {
      let toIndex = touchCurrentIndex.current + slotsMoved;
      // Clamp to bounds
      toIndex = Math.max(0, Math.min(toIndex, players.length - 1));

      if (toIndex !== touchCurrentIndex.current) {
        reorderPlayers && reorderPlayers(touchCurrentIndex.current, toIndex);
        showToast && showToast('Player order updated', 'success');
      }
    }

    touchStartY.current = null;
    touchCurrentIndex.current = null;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-display text-white uppercase tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green"></span>
          Player Roster <span className="text-slate-500 text-lg">({players.length})</span>
        </h3>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Drag to reorder</div>
      </div>

      <div className="space-y-3">
        {players.map((p, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-pitch-base/60 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg hover:border-neon-green/30 hover:shadow-neon-green/5 transition-all cursor-grab group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:via-neon-green transition-colors"></div>

            <div className="flex-1 pl-3">
              <div className="flex items-center gap-2">
                <div className="text-xl font-display text-white cursor-pointer hover:text-neon-green transition-colors" onClick={() => showDetails && showDetails(i)}>{p.name}</div>
                {p.captain && <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-0.5 rounded border border-yellow-500/20">C</span>}
              </div>
              <div className="text-sm text-slate-400 flex gap-3 mt-1 font-medium">
                <span className="text-neon-green/80">{p.position}</span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  {p.level}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-3 sm:mt-0 ml-3 justify-end sm:justify-start w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
              {/* Mobile Touch Drag Hook */}
              <div
                className="flex sm:hidden mr-auto items-center justify-center p-2 text-slate-500 active:text-neon-green cursor-grab active:cursor-grabbing"
                onTouchStart={(e) => onTouchStart(e, i)}
                onTouchMove={(e) => onTouchMove(e, i)}
                onTouchEnd={(e) => onTouchEnd(e, i)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>

              <button onClick={() => editPlayer(i)} className="px-4 py-2 bg-white/5 text-white font-bold text-sm rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">Edit</button>
              <button onClick={() => { deletePlayer(i); showToast && showToast('Player deleted', 'info'); }} className="btn-danger">Delete</button>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 font-medium">
            No players added yet. Add some players above!
          </div>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-3 text-center sm:hidden font-bold uppercase tracking-widest">Hold and drag the hook to reorder</div>
    </div>
  );
}

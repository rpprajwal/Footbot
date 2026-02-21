import React, { useRef } from "react";

export default function PlayerList({ players, deletePlayer, editPlayer, reorderPlayers, showDetails, showToast }) {

  const dragIndex = useRef(null);

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
    if (from === null || from === undefined) return;
    if (from === to) return;
    reorderPlayers && reorderPlayers(from, to);
    showToast && showToast('Player order updated', 'success');
    dragIndex.current = null;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Players</h3>
      <div className="space-y-2">
        {players.map((p, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
            className="flex items-center justify-between p-3 bg-white border rounded shadow-sm hover:shadow-md transition cursor-grab"
          >
            <div>
              <div className="font-medium cursor-pointer" onClick={() => showDetails && showDetails(i)}>{p.name}</div>
              <div className="text-sm text-gray-500">{p.position} • {p.level} {p.captain && "• Captain"}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => editPlayer(i)} className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>
              <button onClick={() => { deletePlayer(i); showToast && showToast('Player deleted', 'info'); }} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">Drag players to reorder</div>
    </div>
  );
}

import React from "react";
import { X, Play, Pause, Trash2, ListMusic, Sparkles, Check } from "lucide-react";

export default function QueueModal({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  queue = [],
  queueIndex = 0,
  onSelectTrackIndex,
  onRemoveFromQueue,
  onClearQueue,
  autoAdvance = true,
  onToggleAutoAdvance,
}) {
  if (!isOpen) return null;

  const upcomingTracks = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#282828] rounded-xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl relative max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282828] pb-4">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-xl font-bold text-white">Cola de Reproducción</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Continuous Autoplay Switch ("1 detrás de otra automáticamente") */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#242424] border border-[#2e2e2e]">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Reproducción Continua Automática</span>
            <span className="text-xs text-[#b3b3b3]">Las canciones suenan una detrás de otra sin detenerse</span>
          </div>
          <button
            onClick={onToggleAutoAdvance}
            style={{
              backgroundColor: autoAdvance ? "var(--accent-color)" : "#3e3e3e",
              color: autoAdvance ? "#000000" : "#ffffff",
            }}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            {autoAdvance ? "ACTIVADO" : "DESACTIVADO"}
          </button>
        </div>

        {/* Currently Playing Track */}
        {currentTrack && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)]">
              Sonando Ahora
            </span>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#202020] border border-[#2c2c2c]">
              <img src={currentTrack.cover} alt={currentTrack.title} className="w-12 h-12 rounded object-cover shadow" />
              <div className="flex flex-col truncate flex-1">
                <span className="font-bold text-sm text-white truncate">{currentTrack.title}</span>
                <span className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</span>
              </div>
              <span className="text-xs font-mono text-[#b3b3b3]">{currentTrack.durationStr || "3:30"}</span>
            </div>
          </div>
        )}

        {/* Next in Queue List */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Siguientes en la Lista ({upcomingTracks.length})
            </span>
            {upcomingTracks.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-xs text-[#b3b3b3] hover:text-red-400 cursor-pointer transition-colors"
              >
                Limpiar cola
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 max-h-60">
            {upcomingTracks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#b3b3b3] bg-[#202020] rounded-lg">
                No hay más canciones pendientes en la cola. Añade canciones con el botón "+ Cola" o busca temas para agregarlos aquí.
              </div>
            ) : (
              upcomingTracks.map((track, i) => {
                const realIndex = queueIndex + 1 + i;

                return (
                  <div
                    key={`${track.id}-${i}`}
                    onClick={() => onSelectTrackIndex?.(realIndex)}
                    className="spotify-track-row flex items-center justify-between p-2.5 rounded group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-4 text-center text-xs font-mono text-[#b3b3b3]">{i + 1}</span>
                      <img src={track.cover} alt={track.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-sm text-white group-hover:text-[var(--accent-color)] truncate">
                          {track.title}
                        </span>
                        <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#b3b3b3]">{track.durationStr || "3:30"}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromQueue?.(realIndex);
                        }}
                        title="Quitar de la cola"
                        className="p-1 text-[#b3b3b3] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#282828] pt-3">
          <button
            onClick={onClose}
            style={{ backgroundColor: "var(--accent-color)" }}
            className="px-6 py-2 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

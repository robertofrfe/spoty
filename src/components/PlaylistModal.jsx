import React, { useState } from "react";
import { X, Plus, Check, Disc, Music } from "lucide-react";
import { musicService } from "../services/musicService";
import { audioEngine } from "../services/audioEngine";

const PLAYLIST_GRADIENTS = [
  { id: "g1", name: "Esmeralda", style: "from-emerald-700 to-teal-900", color: "#10b981" },
  { id: "g2", name: "Púrpura", style: "from-purple-800 to-indigo-950", color: "#8b5cf6" },
  { id: "g3", name: "Cian", style: "from-cyan-700 to-blue-950", color: "#06b6d4" },
  { id: "g4", name: "Fucsia", style: "from-pink-700 to-rose-950", color: "#ec4899" },
  { id: "g5", name: "Ámbar", style: "from-amber-700 to-orange-950", color: "#f59e0b" },
  { id: "g6", name: "Carbón", style: "from-neutral-700 to-neutral-950", color: "#525252" },
];

const PLAYLIST_EMOJIS = ["🎧", "🔥", "🚗", "🌙", "⚡", "🏖️", "💃", "🖤", "✨", "🚀"];

export default function PlaylistModal({
  isOpen,
  onClose,
  mode = "create", // "create" | "add_track"
  trackToAdd = null,
  playlists = [],
  onPlaylistCreated,
  onTrackAdded,
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(PLAYLIST_GRADIENTS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState("🎧");
  const [addedPlaylists, setAddedPlaylists] = useState(new Set());

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPl = musicService.createPlaylist(
      name.trim(),
      desc.trim() || "Playlist creada en MMTOP",
      selectedGradient.color,
      selectedEmoji
    );

    if (trackToAdd) {
      musicService.addTrackToPlaylist(newPl.id, trackToAdd);
    }

    onPlaylistCreated?.(newPl);
    setName("");
    setDesc("");
    audioEngine.playJellyPop(600);
    onClose();
  };

  const handleAddToPlaylist = (playlistId) => {
    if (!trackToAdd) return;
    const added = musicService.addTrackToPlaylist(playlistId, trackToAdd);
    if (added) {
      setAddedPlaylists(new Set(addedPlaylists).add(playlistId));
      onTrackAdded?.(playlistId, trackToAdd);
      audioEngine.playJellyPop(620);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#282828] rounded-xl w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282828] pb-3">
          <h2 className="text-xl font-bold text-white">
            {mode === "create" ? "Nueva playlist" : "Añadir a playlist"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode: Add Track to Existing Playlist */}
        {mode === "add_track" && (
          <div className="flex flex-col gap-4">
            {trackToAdd && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[#242424]">
                <img src={trackToAdd.cover} alt={trackToAdd.title} className="w-12 h-12 rounded object-cover" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-white truncate">{trackToAdd.title}</span>
                  <span className="text-xs text-[#b3b3b3] truncate">{trackToAdd.artist}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
              {playlists.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#b3b3b3]">
                  No tienes ninguna playlist creada todavía. Crea una abajo.
                </div>
              ) : (
                playlists.map((pl) => {
                  const isAdded = addedPlaylists.has(pl.id) || (pl.tracks && pl.tracks.some((t) => t.id === trackToAdd?.id));

                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#242424] transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: pl.color || "#1ed760" }}
                          className="w-10 h-10 rounded flex items-center justify-center text-lg shadow-sm"
                        >
                          {pl.emoji || "🎵"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white group-hover:text-[var(--accent-color)]">{pl.name}</span>
                          <span className="text-xs text-[#b3b3b3]">{pl.tracks?.length || 0} canciones</span>
                        </div>
                      </div>

                      {isAdded ? (
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-color)] text-black flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-[#3e3e3e] group-hover:border-white text-[#b3b3b3] group-hover:text-white flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#282828] pt-3">
              <button
                onClick={() => {
                  setName("");
                  // switch modal internally to create
                  document.getElementById("toggle-create-view")?.click();
                }}
                className="w-full py-2.5 rounded-full border border-[#3e3e3e] hover:border-white text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear nueva playlist para esta canción</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode: Create New Playlist with Custom Color and Emoji */}
        <form id="create-playlist-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Live Cover Preview */}
            <div
              style={{ backgroundColor: selectedGradient.color }}
              className="w-24 h-24 rounded-lg flex items-center justify-center text-4xl shadow-xl flex-shrink-0"
            >
              {selectedEmoji}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la playlist..."
                className="w-full px-3 py-2 rounded bg-[#242424] text-sm text-white placeholder-[#757575] outline-none focus:ring-2 focus:ring-white"
              />
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción (opcional)..."
                className="w-full px-3 py-1.5 rounded bg-[#242424] text-xs text-white placeholder-[#757575] outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          {/* Color Gradient Picker */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-semibold text-[#b3b3b3]">Color de portada</span>
            <div className="flex items-center gap-2">
              {PLAYLIST_GRADIENTS.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setSelectedGradient(g)}
                  style={{ backgroundColor: g.color }}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                    selectedGradient.id === g.id ? "ring-2 ring-white scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Emoji Badge Picker */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-semibold text-[#b3b3b3]">Icono temático</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PLAYLIST_EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-8 h-8 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] flex items-center justify-center text-base transition-transform ${
                    selectedEmoji === emoji ? "ring-2 ring-[var(--accent-color)] scale-110 bg-[#333333]" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#b3b3b3] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: "var(--accent-color)" }}
              className="px-6 py-2.5 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
            >
              Crear Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

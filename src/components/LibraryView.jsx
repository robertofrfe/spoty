import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Play, Pause, Trash2, Heart, Plus, Music2, Disc, ArrowLeft, ListPlus } from "lucide-react";
import { musicService } from "../services/musicService";
import { audioEngine } from "../services/audioEngine";

export default function LibraryView({
  onPlayTrack,
  onPlayQueue,
  onAddToQueue,
  currentTrack,
  isPlaying,
  onOpenCreatePlaylist,
  playlists = [],
  initialPlaylist = null,
  onSelectPlaylist,
  onDeletePlaylist,
}) {
  const [localTracks, setLocalTracks] = useState([]);
  const [activeTab, setActiveTab] = useState("playlists");
  const [selectedPlaylist, setSelectedPlaylist] = useState(initialPlaylist);

  useEffect(() => {
    if (initialPlaylist) {
      setSelectedPlaylist(initialPlaylist);
      setActiveTab("playlists");
    }
  }, [initialPlaylist]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const likedTracks = musicService.getLikedTracks();

  useEffect(() => {
    loadLocalTracks();
  }, []);

  const loadLocalTracks = async () => {
    const tracks = await musicService.getLocalTracks();
    setLocalTracks(tracks);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      if (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
        await musicService.saveLocalTrack(file);
      }
    }
    await loadLocalTracks();
    setIsUploading(false);
    audioEngine.playJellyPop(580);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteLocal = async (id, e) => {
    e.stopPropagation();
    await musicService.deleteLocalTrack(id);
    await loadLocalTracks();
    audioEngine.playJellyPop(300);
  };

  const handleRemoveFromPlaylist = (playlistId, trackId, e) => {
    e.stopPropagation();
    musicService.removeTrackFromPlaylist(playlistId, trackId);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist({
        ...selectedPlaylist,
        tracks: selectedPlaylist.tracks.filter((t) => t.id !== trackId)
      });
    }
    audioEngine.playJellyPop(350);
  };

  // If a playlist is selected, show its full track view
  if (selectedPlaylist) {
    return (
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 overflow-y-auto pb-32 select-none bg-[#121212]">
        <button
          onClick={() => { setSelectedPlaylist(null); onSelectPlaylist?.(null); }}
          className="flex items-center gap-2 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Tu biblioteca</span>
        </button>

        {/* Playlist Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 p-4 sm:p-6 rounded-lg bg-gradient-to-b from-[#282828] to-[#121212] text-center sm:text-left">
          <div
            style={{ backgroundColor: selectedPlaylist.color || "#1ed760" }}
            className="w-28 h-28 sm:w-40 sm:h-40 rounded-lg flex items-center justify-center text-4xl sm:text-6xl shadow-2xl flex-shrink-0"
          >
            {selectedPlaylist.emoji || "🎵"}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-white">Playlist</span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white">{selectedPlaylist.name}</h1>
            <span className="text-sm text-[#b3b3b3]">{selectedPlaylist.description}</span>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 flex-wrap">
              <span className="text-xs text-white/60">{selectedPlaylist.tracks?.length || 0} canciones</span>
              {selectedPlaylist.tracks?.length > 0 && (
                <button
                  onClick={() => {
                    const tracks = selectedPlaylist.tracks;
                    const randIdx = Math.floor(Math.random() * tracks.length);
                    if (onPlayQueue) {
                      onPlayQueue(tracks, randIdx);
                    } else {
                      onPlayTrack?.(tracks[randIdx]);
                    }
                  }}
                  style={{ backgroundColor: "var(--accent-color)" }}
                  className="px-6 py-2 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Reproducir todo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Playlist Tracks */}
        <div className="flex flex-col">
          {!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0 ? (
            <div className="p-12 text-center text-[#b3b3b3] text-sm">
              Esta playlist aún no tiene canciones. Busca cualquier canción en "Buscar" y pulsa "+" para añadirla aquí.
            </div>
          ) : (
            selectedPlaylist.tracks.map((track, idx) => {
              const isThisPlaying = isPlaying && currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => (onPlayQueue ? onPlayQueue(selectedPlaylist.tracks, idx) : onPlayTrack?.(track))}
                  className="spotify-track-row flex items-center justify-between p-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 truncate">
                    <span className="w-4 text-center text-sm font-mono text-[#b3b3b3]">
                      {idx + 1}
                    </span>
                    <img src={track.cover} alt={track.title} className="w-10 h-10 rounded object-cover" />
                    <div className="flex flex-col truncate">
                      <span className={`font-medium text-sm truncate ${isThisPlaying ? "text-[var(--accent-color)]" : "text-white"}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-[#b3b3b3]">{track.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue?.(track);
                      }}
                      title="Añadir a la cola"
                      className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-[#b3b3b3]">{track.durationStr || "3:30"}</span>
                    <button
                      onClick={(e) => handleRemoveFromPlaylist(selectedPlaylist.id, track.id, e)}
                      title="Quitar de esta playlist"
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
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 overflow-y-auto pb-32 select-none bg-[#121212]">
      {/* Top Filter Chips */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "playlists"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Playlists ({playlists.length})
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "favorites"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Canciones que te gustan ({likedTracks.length})
          </button>

          <button
            onClick={() => setActiveTab("uploads")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "uploads"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Archivos locales ({localTracks.length})
          </button>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          style={{ backgroundColor: "var(--accent-color)" }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear playlist</span>
        </button>
      </div>

      {/* Playlists Grid */}
      {activeTab === "playlists" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Liked songs card */}
          <div
            onClick={() => setActiveTab("favorites")}
            className="spotify-card p-4 flex flex-col justify-end aspect-square bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600 cursor-pointer group col-span-2 rounded-md"
          >
            <div className="flex flex-col gap-1">
              <span className="font-bold text-2xl text-white">Canciones que te gustan</span>
              <span className="text-xs text-[#b3b3b3]">
                {likedTracks.length === 0 ? "0 canciones guardadas" : `${likedTracks.length} canciones`}
              </span>
            </div>
          </div>

          {/* User playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylist(pl)}
              className="spotify-card p-4 flex flex-col gap-3 group cursor-pointer"
            >
              <div
                style={{ backgroundColor: pl.color || "#282828" }}
                className="aspect-square w-full rounded-md flex items-center justify-center text-4xl shadow-md transition-transform group-hover:scale-102"
              >
                {pl.emoji || "🎵"}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white truncate">
                  {pl.name}
                </span>
                <span className="text-xs text-[#b3b3b3]">{pl.tracks?.length || 0} canciones</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favorites (Liked Songs) View - Starts with 0 default songs */}
      {activeTab === "favorites" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-end gap-6 p-6 rounded-lg bg-gradient-to-b from-[#5038a0] to-[#121212]">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-2xl flex-shrink-0">
              <Heart className="w-20 h-20 fill-white" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-white">Playlist</span>
              <h1 className="text-4xl sm:text-5xl font-black text-white">Canciones que te gustan</h1>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 flex-wrap">
                <span className="text-sm text-[#b3b3b3]">{likedTracks.length} canciones guardadas</span>
                {likedTracks.length > 0 && (
                  <button
                    onClick={() => {
                    const randIdx = Math.floor(Math.random() * likedTracks.length);
                    if (onPlayQueue) {
                      onPlayQueue(likedTracks, randIdx);
                    } else {
                      onPlayTrack?.(likedTracks[randIdx]);
                    }
                  }}
                    style={{ backgroundColor: "var(--accent-color)" }}
                    className="px-6 py-2 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Reproducir todo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {likedTracks.length === 0 ? (
              <div className="p-12 text-center text-[#b3b3b3] text-sm bg-[#181818] rounded-md flex flex-col items-center gap-3">
                <Heart className="w-10 h-10 text-[#555555]" />
                <span className="font-bold text-white text-base">Las canciones que te gustan aparecerán aquí</span>
                <span className="text-xs max-w-sm">
                  Guarda canciones tocando el icono de corazón en cualquier tema que busques o escuches.
                </span>
              </div>
            ) : (
              likedTracks.map((track, idx) => {
                const isThisPlaying = isPlaying && currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => (onPlayQueue ? onPlayQueue(likedTracks, idx) : onPlayTrack?.(track))}
                    className="spotify-track-row flex items-center justify-between p-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 truncate">
                      <span className="w-4 text-center text-sm font-mono text-[#b3b3b3]">
                        {idx + 1}
                      </span>
                      <img src={track.cover} alt={track.title} className="w-10 h-10 rounded object-cover" />
                      <div className="flex flex-col truncate">
                        <span className={`font-medium text-sm truncate ${isThisPlaying ? "text-[var(--accent-color)]" : "text-white"}`}>
                          {track.title}
                        </span>
                        <span className="text-xs text-[#b3b3b3]">{track.artist}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue?.(track);
                        }}
                        title="Añadir a la cola"
                        className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                      <Heart className="w-4 h-4 fill-[var(--accent-color)] text-[var(--accent-color)]" />
                      <span className="text-xs font-mono text-[#b3b3b3]">{track.durationStr || "3:30"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Local MP3 Files */}
      {activeTab === "uploads" && (
        <div className="flex flex-col gap-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-[#282828] hover:border-[var(--accent-color)] bg-[#181818] rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
              className="hidden"
            />
            <div
              style={{ backgroundColor: "var(--accent-color)" }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-lg"
            >
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-bold text-base text-white">
                {isUploading ? "Guardando archivos..." : "Subir música local (MP3 / FLAC)"}
              </span>
              <span className="text-xs text-[#b3b3b3] max-w-sm mt-1">
                Canciones enteras guardadas en tu navegador para escuchar sin conexión, con pantalla apagada y sin anuncios.
              </span>
            </div>
            <button className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs pointer-events-none mt-2">
              Elegir archivos
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-white">
              Tus archivos locales ({localTracks.length})
            </h3>

            {localTracks.length === 0 ? (
              <div className="p-8 text-center text-[#b3b3b3] text-sm bg-[#181818] rounded-md">
                No tienes canciones subidas todavía.
              </div>
            ) : (
              <div className="flex flex-col">
                {localTracks.map((track, idx) => {
                  const isThisPlaying = isPlaying && currentTrack?.id === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack?.(track)}
                      className="spotify-track-row flex items-center justify-between p-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 truncate">
                        <span className="w-4 text-center text-sm font-mono text-[#b3b3b3]">
                          {idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center text-[var(--accent-color)]">
                          <Music2 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-medium text-sm text-white truncate">
                            {track.title}
                          </span>
                          <span className="text-xs text-[#b3b3b3]">Archivo Local</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => handleDeleteLocal(track.id, e)}
                          title="Eliminar"
                          className="p-1 text-[#b3b3b3] hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

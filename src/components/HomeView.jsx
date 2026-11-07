import React, { useState, useEffect } from "react";
import { Play, Pause, Heart, Plus, History, Sparkles } from "lucide-react";
import { musicService, POPULAR_ARTISTS, POPULAR_HITS } from "../services/musicService";
import { IMPORTED_PLAYLIST } from "../data/importedPlaylist.js";

export default function HomeView({
  onTogglePlay,
  onPlayTrack,
  onPlayQueue,
  onAddToQueue,
  currentTrack,
  isPlaying,
  onNavigateSearch,
  onOpenAddToPlaylist,
  onToggleLike,
  isLiked,
  onSelectArtist,
}) {
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => musicService.getRecentlyPlayed());

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setRecentlyPlayed(e.detail);
      } else {
        setRecentlyPlayed(musicService.getRecentlyPlayed());
      }
    };
    window.addEventListener("mmtop:recently-played-updated", handleUpdate);
    return () => window.removeEventListener("mmtop:recently-played-updated", handleUpdate);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Buenos días"
      : hour < 20
      ? "Buenas tardes"
      : "Buenas noches";

  // Featured playlist tracks right at the top
  const eldenTracks = IMPORTED_PLAYLIST.tracks.slice(0, 6);
  const quickList = eldenTracks;

  return (
    <div className="flex-1 flex flex-col gap-6 md:gap-8 p-4 md:p-6 overflow-y-auto pb-32 select-none bg-transparent">
      {/* Greeting Header (Desktop only - mobile is rendered in the top adaptive Header) */}
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {greeting}
        </h1>
        <span className="text-xs font-semibold text-[#b3b3b3]">MMTOP • Sin Anuncios</span>
      </div>

      {/* 6-Grid Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickList.map((track, idx) => {
          const isThisPlaying = isPlaying && currentTrack?.id === track.id;

          return (
            <div
              key={track.id || idx}
              onClick={() => (onPlayQueue ? onPlayQueue(quickList, idx) : onPlayTrack?.(track))}
              className="bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-between cursor-pointer group transition-all duration-200 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4 truncate">
                <img
                  src={track.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80"}
                  alt={track.title}
                  className="w-14 h-14 md:w-16 md:h-16 object-cover flex-shrink-0 shadow-md"
                />
                <div className="flex flex-col truncate pr-2">
                  <span className="font-bold text-sm text-white truncate">
                    {track.title}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist?.(track.artistId || track.artist);
                    }}
                    className="text-xs text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer"
                  >
                    {track.artist}
                  </span>
                </div>
              </div>

              {/* Hover Dynamic Accent Play Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isThisPlaying) {
                    onTogglePlay?.();
                  } else if (onPlayQueue) {
                    onPlayQueue(quickList, idx);
                  } else {
                    onPlayTrack?.(track);
                  }
                }}
                style={{ backgroundColor: "var(--accent-color)" }}
                className={`w-12 h-12 rounded-full text-black flex items-center justify-center mr-4 flex-shrink-0 shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 ${
                  isThisPlaying
                    ? "opacity-100 scale-100"
                    : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                }`}
              >
                {isThisPlaying ? (
                  <Pause className="w-5 h-5 fill-black text-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Section: Escuchado recientemente (Replaces Exitos de hoy) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[var(--accent-color)]" />
            <h2 className="text-2xl font-bold text-white">Escuchado recientemente</h2>
          </div>
          {recentlyPlayed.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem("mmtop_recently_played");
                setRecentlyPlayed([]);
              }}
              className="text-xs font-semibold text-[#b3b3b3] hover:text-white hover:underline cursor-pointer transition-colors"
            >
              Borrar historial
            </button>
          )}
        </div>

        {recentlyPlayed.length === 0 ? (
          <div className="bg-[#181818] border border-[#282828] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
            <Sparkles className="w-10 h-10 text-[var(--accent-color)] opacity-80" />
            <h3 className="text-lg font-bold text-white">Tus canciones escuchadas aparecerán aquí</h3>
            <p className="text-sm text-[#b3b3b3] max-w-md">
              A medida que busques artistas, explores categorías o reproduzcas música, tu historial personalizado se guardará aquí.
            </p>
            <button
              onClick={() => onNavigateSearch?.("")}
              style={{ backgroundColor: "var(--accent-color)" }}
              className="mt-2 px-5 py-2.5 rounded-full text-black font-bold text-sm hover:scale-105 transition-transform cursor-pointer shadow-lg"
            >
              Explorar canciones
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyPlayed.map((track, idx) => {
              const isThisPlaying = isPlaying && currentTrack?.id === track.id;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => (onPlayQueue ? onPlayQueue(recentlyPlayed, idx) : onPlayTrack?.(track))}
                  className="spotify-card p-4 flex flex-col gap-3 group cursor-pointer"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden shadow-lg bg-[#282828]">
                    <img
                      src={track.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80"}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisPlaying) {
                          onTogglePlay?.();
                        } else if (onPlayQueue) {
                          onPlayQueue(recentlyPlayed, idx);
                        } else {
                          onPlayTrack?.(track);
                        }
                      }}
                      style={{ backgroundColor: "var(--accent-color)" }}
                      className={`absolute bottom-2 right-2 w-12 h-12 rounded-full text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 ${
                        isThisPlaying
                          ? "opacity-100 scale-100"
                          : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 fill-black text-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-white truncate" title={track.title}>
                        {track.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddToPlaylist?.(track);
                        }}
                        title="Añadir a playlist"
                        className="text-[#b3b3b3] hover:text-white p-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist?.(track.artistId || track.artist);
                      }}
                      className="text-xs text-[#b3b3b3] truncate mt-0.5 hover:text-white hover:underline cursor-pointer"
                    >
                      {track.artist}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Artistas Populares */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Artistas populares</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist?.(artist.id || artist.name)}
              className="spotify-card p-4 flex flex-col items-center text-center gap-3 cursor-pointer group"
            >
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg bg-[#282828] group-hover:scale-105 transition-transform duration-200">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col truncate w-full text-left pl-1">
                <span className="font-bold text-sm text-white truncate group-hover:underline">
                  {artist.name}
                </span>
                <span className="text-xs text-[#b3b3b3]">Artista</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

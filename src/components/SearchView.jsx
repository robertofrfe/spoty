import React, { useState, useEffect } from "react";
import { Search, Play, Pause, Heart, Clock, Plus, ListPlus, CheckCircle2, User } from "lucide-react";
import { musicService, GENRES } from "../services/musicService";

export default function SearchView({
  searchQuery,
  setSearchQuery,
  onPlayTrack,
  onPlayQueue,
  onAddToQueue,
  currentTrack,
  isPlaying,
  onToggleLike,
  isLiked,
  onOpenAddToPlaylist,
  onSelectArtist,
}) {
  const [results, setResults] = useState({ songs: [], artists: [], topResult: null });
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "songs" | "artists"

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults({ songs: [], artists: [], topResult: null });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const data = await musicService.searchMusic(searchQuery);
      setResults(data);
      setIsLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGenreClick = (genre) => {
    setSearchQuery(genre.name);
  };

  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 overflow-y-auto pb-32 select-none bg-[#121212]">
      {/* Category Filter Pills if searching */}
      {hasSearch && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setActiveFilter("songs")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeFilter === "songs"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Canciones
          </button>
          <button
            onClick={() => setActiveFilter("artists")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeFilter === "artists"
                ? "bg-white text-black"
                : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            Artistas
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
          <Search className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
          <span>Buscando en catálogo oficial para "{searchQuery}"...</span>
        </div>
      )}

      {/* Search results view */}
      {hasSearch ? (
        <div className="flex flex-col gap-8">
          {results.songs.length === 0 && results.artists.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-[#b3b3b3] text-base">
              No se han encontrado resultados para "{searchQuery}". Intenta con otro término o artista.
            </div>
          ) : (
            <>
              {/* TOP RESULT & PREVIEW SONGS (in "Todo" view) */}
              {activeFilter === "all" && results.topResult && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Top Result Card */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-white">Mejor resultado</h2>

                    {results.topResult.type === "artist" ? (
                      /* Artist Top Result Card */
                      <div
                        onClick={() => onSelectArtist?.(results.topResult.id || results.topResult.name)}
                        className="spotify-card p-6 rounded-lg flex flex-col justify-between gap-4 cursor-pointer group h-full relative"
                      >
                        <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={results.topResult.picture}
                            alt={results.topResult.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#3d91f4]">
                            <CheckCircle2 className="w-4 h-4 fill-[#3d91f4] text-black" />
                            <span>Artista verificado</span>
                          </div>
                          <h3 className="text-3xl font-extrabold text-white truncate">
                            {results.topResult.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#b3b3b3] mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-black/50 font-semibold text-white">
                              Artista
                            </span>
                            <span>•</span>
                            <span>{results.topResult.fansFormatted || results.topResult.fans} oyentes</span>
                          </div>
                        </div>

                        <button
                          style={{ backgroundColor: "var(--accent-color)" }}
                          className="absolute bottom-6 right-6 px-4 py-2 rounded-full text-black font-bold text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 hover:scale-105 cursor-pointer"
                        >
                          Ver perfil
                        </button>
                      </div>
                    ) : (
                      /* Track Top Result Card */
                      <div
                        onClick={() => onPlayTrack?.(results.topResult)}
                        className="spotify-card p-5 rounded-lg flex flex-col justify-between gap-4 cursor-pointer group h-full relative"
                      >
                        <img
                          src={results.topResult.cover}
                          alt={results.topResult.title}
                          className="w-28 h-28 rounded-md object-cover shadow-xl"
                        />

                        <div className="flex flex-col">
                          <h3 className="text-3xl font-bold text-white truncate">
                            {results.topResult.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-[#b3b3b3] mt-2">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectArtist?.(results.topResult.artistId || results.topResult.artist);
                              }}
                              className="font-semibold text-white hover:underline cursor-pointer"
                            >
                              {results.topResult.artist}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full bg-black/40 text-xs font-bold text-white">
                              Original
                            </span>
                          </div>
                        </div>

                        {/* Accent Play Button */}
                        <button
                          style={{ backgroundColor: "var(--accent-color)" }}
                          className="absolute bottom-5 right-5 w-12 h-12 rounded-full text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 hover:scale-105 cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Top 4 Songs */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-white">Canciones</h2>
                    <div className="flex flex-col">
                      {results.songs.slice(0, 4).map((track, idx) => {
                        const isThisPlaying = isPlaying && currentTrack?.id === track.id;
                        const liked = isLiked?.(track.id);

                        return (
                          <div
                            key={track.id}
                            onClick={() => (onPlayQueue ? onPlayQueue(results.songs, idx) : onPlayTrack?.(track))}
                            className="spotify-track-row flex items-center justify-between p-2 group cursor-pointer rounded-md"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={track.cover}
                                  alt={track.title}
                                  className="w-full h-full object-cover"
                                />
                                <div
                                  className={`absolute inset-0 bg-black/50 flex items-center justify-center ${
                                    isThisPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {isThisPlaying ? (
                                    <Pause className="w-4 h-4 fill-white text-white" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col truncate pr-2">
                                <span className={`font-medium text-sm truncate ${isThisPlaying ? "text-[var(--accent-color)]" : "text-white"}`}>
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAddToPlaylist?.(track);
                                }}
                                title="Añadir a playlist"
                                className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLike?.(track);
                                }}
                                className="p-1 text-[#b3b3b3] hover:text-white"
                              >
                                <Heart className={`w-4 h-4 ${liked ? "fill-[var(--accent-color)] text-[var(--accent-color)]" : ""}`} />
                              </button>
                              <span className="text-xs text-[#b3b3b3] font-mono">
                                {track.durationStr || "3:30"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ARTISTS SECTION (in "Todo" view if artists are present) */}
              {activeFilter === "all" && results.artists.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Artistas</h2>
                    <button
                      onClick={() => setActiveFilter("artists")}
                      className="text-xs font-bold text-[#b3b3b3] hover:text-white uppercase tracking-wider cursor-pointer"
                    >
                      Mostrar todos
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.artists.slice(0, 6).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onSelectArtist?.(art.id)}
                        className="spotify-card p-4 rounded-lg flex flex-col items-center text-center gap-3 group cursor-pointer"
                      >
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-200">
                          <img
                            src={art.picture}
                            alt={art.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col truncate w-full">
                          <span className="font-bold text-sm text-white truncate group-hover:underline">
                            {art.name}
                          </span>
                          <span className="text-xs text-[#b3b3b3] mt-0.5">Artista</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEDICATED ARTISTS FILTER TAB VIEW */}
              {activeFilter === "artists" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-white">Artistas encontrados</h2>

                  {results.artists.length === 0 ? (
                    <div className="p-8 text-center text-[#b3b3b3]">
                      No se encontraron artistas para "{searchQuery}".
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {results.artists.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => onSelectArtist?.(art.id)}
                          className="spotify-card p-4 rounded-lg flex flex-col items-center text-center gap-3 group cursor-pointer"
                        >
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-200">
                            <img
                              src={art.picture}
                              alt={art.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex flex-col truncate w-full">
                            <span className="font-bold text-sm text-white truncate group-hover:underline">
                              {art.name}
                            </span>
                            <span className="text-xs text-[#b3b3b3] mt-0.5">
                              {art.fansFormatted ? `${art.fansFormatted} oyentes` : "Artista"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FULL SONGS TABLE (in "Todo" or "Canciones" filter) */}
              {(activeFilter === "all" || activeFilter === "songs") && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider px-3 pb-2 border-b border-[#282828]">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6 sm:col-span-5">Título</div>
                    <div className="hidden sm:block sm:col-span-4">Álbum</div>
                    <div className="col-span-5 sm:col-span-2 flex justify-end pr-2">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    {results.songs.map((track, idx) => {
                      const isThisPlaying = isPlaying && currentTrack?.id === track.id;
                      const liked = isLiked?.(track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => (onPlayQueue ? onPlayQueue(results.songs, idx) : onPlayTrack?.(track))}
                          className="spotify-track-row grid grid-cols-12 items-center px-3 py-2 text-sm text-[#b3b3b3] cursor-pointer group rounded-md"
                        >
                          {/* Number / Play icon */}
                          <div className="col-span-1 flex items-center">
                            <span className={`w-4 text-center font-mono ${isThisPlaying ? "text-[var(--accent-color)]" : "group-hover:hidden"}`}>
                              {idx + 1}
                            </span>
                            <button className="hidden group-hover:block text-white">
                              {isThisPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-white text-white" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-white text-white" />
                              )}
                            </button>
                          </div>

                          {/* Title & Artist */}
                          <div className="col-span-6 sm:col-span-5 flex items-center gap-3 truncate pr-2">
                            <img
                              src={track.cover}
                              alt={track.title}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col truncate">
                              <span className={`font-medium text-sm truncate ${isThisPlaying ? "text-[var(--accent-color)]" : "text-white"}`}>
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

                          {/* Album */}
                          <div className="hidden sm:block sm:col-span-4 truncate text-xs text-[#b3b3b3]">
                            {track.album || "Sencillo"}
                          </div>

                          {/* Like, Add to playlist, Queue & Duration */}
                          <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-3 pr-2">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAddToPlaylist?.(track);
                              }}
                              title="Añadir a playlist"
                              className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike?.(track);
                              }}
                              className="p-1 text-[#b3b3b3] hover:text-white"
                            >
                              <Heart className={`w-4 h-4 ${liked ? "fill-[var(--accent-color)] text-[var(--accent-color)]" : ""}`} />
                            </button>
                            <span className="text-xs font-mono text-[#b3b3b3]">
                              {track.durationStr || "3:30"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Empty Search: Browse All Categories */
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">Explorar todo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {GENRES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => handleGenreClick(genre)}
                style={{ backgroundColor: genre.color }}
                className="relative aspect-[1.1] sm:aspect-square rounded-xl p-4 cursor-pointer overflow-hidden shadow-lg hover:scale-[1.03] transition-all duration-300 group select-none"
              >
                {/* Genre Title */}
                <span className="relative z-10 font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-snug break-words drop-shadow-sm">
                  {genre.name}
                </span>

                {/* Spotify Signature Tilted Category Image */}
                {genre.image && (
                  <img
                    src={genre.image}
                    alt={genre.name}
                    className="absolute -bottom-2 -right-4 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-md shadow-2xl rotate-[25deg] pointer-events-none group-hover:scale-110 group-hover:rotate-[20deg] transition-all duration-300"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

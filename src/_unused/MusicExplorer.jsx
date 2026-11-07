import React, { useState, useEffect } from "react";
import { Search, Play, Pause, Heart, Sparkles, Flame, Compass } from "lucide-react";
import { musicService } from "../services/musicService";
import { audioEngine } from "../services/audioEngine";

export default function MusicExplorer({
  searchQuery,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onToggleLike,
  isLiked,
}) {
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("trending");
  const [customYtInput, setCustomYtInput] = useState("");

  const categories = [
    { id: "trending", name: "🔥 En Tendencia", query: "" },
    { id: "asmr", name: "🫧 ASMR & Gel", query: "asmr ambient relaxing" },
    { id: "lofi", name: "☕ Lo-Fi Beats", query: "lofi chill hop" },
    { id: "synth", name: "🌌 Synthwave 8D", query: "synthwave retro" },
    { id: "electronic", name: "⚡ Electrónica", query: "electronic dance edm" },
    { id: "pop", name: "🎤 Pop & Trap", query: "pop trap" },
  ];

  useEffect(() => {
    // Load trending tracks on mount
    musicService.getTrendingAudius().then((tracks) => {
      setTrending(tracks);
    });
  }, []);

  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 1) {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = async (term) => {
    setIsLoading(true);
    const tracks = await musicService.searchAudius(term);
    setResults(tracks);
    setIsLoading(false);
  };

  const handleCategorySelect = async (cat) => {
    setActiveCategory(cat.id);
    if (cat.id === "trending") {
      setResults([]);
    } else {
      setIsLoading(true);
      const tracks = await musicService.searchAudius(cat.query);
      setResults(tracks);
      setIsLoading(false);
    }
  };

  const handlePlayYouTubeLink = (e) => {
    e.preventDefault();
    if (!customYtInput) return;
    const track = musicService.createYouTubeTrack(
      "Audio de YouTube",
      "Transmisión Directa",
      customYtInput
    );
    onPlayTrack?.(track);
    setCustomYtInput("");
  };

  const displayList = results.length > 0 ? results : trending;

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 pr-1 select-none">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 border border-pink-300"
                : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* YouTube Direct Song Input Box */}
      <div className="jelly-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#1d0925]/90 to-[#280c2f]/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">¿Quieres escuchar CUALQUIER canción de YouTube?</span>
            <span className="text-xs text-white/60">Pega un enlace o ID de YouTube y sonará sin anuncios en tu Spotify</span>
          </div>
        </div>

        <form onSubmit={handlePlayYouTubeLink} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={customYtInput}
            onChange={(e) => setCustomYtInput(e.target.value)}
            placeholder="https://youtu.be/... o ID"
            className="px-3.5 py-2 rounded-full bg-black/40 border border-white/10 text-xs text-white placeholder-white/40 outline-none focus:border-pink-500 w-full sm:w-60"
          />
          <button
            type="submit"
            className="jelly-pill-btn px-4 py-2 text-xs font-bold text-white flex-shrink-0 cursor-pointer"
          >
            Reproducir
          </button>
        </form>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeCategory === "trending" ? (
            <Flame className="w-5 h-5 text-orange-400" />
          ) : (
            <Compass className="w-5 h-5 text-pink-400" />
          )}
          <h2 className="text-xl font-extrabold text-white">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : activeCategory === "trending"
              ? "Canciones Más Escuchadas (Streaming Gratis & Sin Anuncios)"
              : categories.find((c) => c.id === activeCategory)?.name}
          </h2>
        </div>

        {isLoading && (
          <span className="text-xs text-pink-300 font-mono animate-pulse">
            Buscando pistas en Audius...
          </span>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayList.map((track) => {
          const isThisPlaying = isPlaying && currentTrack?.id === track.id;
          const liked = isLiked?.(track.id);

          return (
            <div
              key={track.id}
              className="jelly-card p-3 flex flex-col gap-2.5 group hover:border-pink-500/80 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg bg-black/20">
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80";
                  }}
                />

                {/* Floating Play Button */}
                <button
                  onClick={() => onPlayTrack?.(track)}
                  className={`absolute bottom-3 right-3 w-11 h-11 rounded-full jelly-pill-btn flex items-center justify-center text-white shadow-xl transition-all duration-300 cursor-pointer ${
                    isThisPlaying ? "opacity-100 scale-100 ring-2 ring-pink-300" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  }`}
                >
                  {isThisPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Title & Artist & Like */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col truncate flex-1">
                  <span className="font-bold text-sm text-white group-hover:text-pink-300 truncate">
                    {track.title}
                  </span>
                  <span className="text-xs text-white/60 truncate">{track.artist}</span>
                </div>

                <button
                  onClick={() => onToggleLike?.(track.id)}
                  className="p-1 text-white/40 hover:text-pink-400 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      liked ? "fill-pink-500 text-pink-500" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

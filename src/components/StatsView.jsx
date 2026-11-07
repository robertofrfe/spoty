import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Clock,
  Flame,
  Trophy,
  Play,
  Pause,
  Music,
  Headphones,
  Calendar,
  Sparkles,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { statsService } from "../services/statsService";

export default function StatsView({ onPlayTrack, currentTrack, isPlaying }) {
  const [stats, setStats] = useState(statsService.getSummary());

  useEffect(() => {
    const unsubscribe = statsService.subscribe((updated) => {
      setStats(updated);
    });
    return unsubscribe;
  }, []);

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return "0 min";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${sec % 60}s`;
  };

  const topSong = stats.topTrack;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 overflow-y-auto pb-32 select-none bg-[#121212]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#282828] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] text-black flex items-center justify-center font-bold shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Tus Estadísticas</h1>
            <span className="text-xs text-[#b3b3b3]">Datos en tiempo real de lo que escuchas en MMTOP</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm("¿Quieres reiniciar tus estadísticas?")) {
              statsService.resetStats();
            }
          }}
          title="Reiniciar estadísticas"
          className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-full transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Listening Time */}
        <div className="spotify-card p-5 flex flex-col justify-between gap-3 border border-[#282828]">
          <div className="flex items-center justify-between text-[#b3b3b3]">
            <span className="text-xs font-bold uppercase tracking-wider">Tiempo Escuchado</span>
            <Clock className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {stats.hours > 0 ? `${stats.hours}h ${stats.minutes}m` : `${stats.minutes} min`}
            </span>
            <span className="text-xs text-[#b3b3b3] mt-1">
              {stats.totalListeningSeconds} segundos totales
            </span>
          </div>
        </div>

        {/* Card 2: Total Songs Played */}
        <div className="spotify-card p-5 flex flex-col justify-between gap-3 border border-[#282828]">
          <div className="flex items-center justify-between text-[#b3b3b3]">
            <span className="text-xs font-bold uppercase tracking-wider">Canciones Reproducidas</span>
            <Music className="w-5 h-5 text-[#00d2ff]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {stats.totalSongsPlayed}
            </span>
            <span className="text-xs text-[#b3b3b3] mt-1">
              Temas escuchados
            </span>
          </div>
        </div>

        {/* Card 3: Nivel de Melómano Badge */}
        <div className="spotify-card p-5 flex flex-col justify-between gap-3 border border-[#282828]">
          <div className="flex items-center justify-between text-[#b3b3b3]">
            <span className="text-xs font-bold uppercase tracking-wider">Nivel Musical</span>
            <Trophy className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-white truncate">
              {stats.badge}
            </span>
            <span className="text-xs text-[#b3b3b3] mt-1">
              {stats.activeDaysCount} día(s) activo(s) en MMTOP
            </span>
          </div>
        </div>
      </div>

      {/* Hero: Canción Más Escuchada */}
      {topSong ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ef4444]" />
            <h2 className="text-xl font-bold text-white">Tu Canción #1 Más Escuchada</h2>
          </div>

          <div className="spotify-card p-6 rounded-xl bg-gradient-to-r from-[#202020] via-[#1a1a1a] to-[#141414] border border-[#2e2e2e] flex flex-col sm:flex-row items-center justify-between gap-6 relative group overflow-hidden">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden shadow-2xl flex-shrink-0 bg-[#282828]">
                <img
                  src={topSong.cover}
                  alt={topSong.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-black text-[#f59e0b] border border-[#f59e0b]/40">
                  #1 TOP
                </div>
              </div>

              <div className="flex flex-col truncate">
                <span className="text-xs font-bold uppercase text-[var(--accent-color)] tracking-wider">
                  MÁS REPETIDA
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white truncate mt-1">
                  {topSong.title}
                </h3>
                <span className="text-sm font-semibold text-[#b3b3b3] truncate mt-0.5">
                  {topSong.artist}
                </span>

                <div className="flex items-center gap-4 text-xs text-[#b3b3b3] mt-3 font-mono">
                  <span><strong>{topSong.playCount}</strong> reproducciones</span>
                  <span>•</span>
                  <span><strong>{formatSeconds(topSong.totalSeconds)}</strong> escuchados</span>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={() => onPlayTrack?.(topSong)}
              style={{ backgroundColor: "var(--accent-color)" }}
              className="w-14 h-14 rounded-full text-black flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer flex-shrink-0"
            >
              {isPlaying && currentTrack?.id === topSong.id ? (
                <Pause className="w-6 h-6 fill-black text-black" />
              ) : (
                <Play className="w-6 h-6 fill-black text-black ml-0.5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="spotify-card p-8 rounded-xl text-center text-[#b3b3b3] text-sm border border-[#282828] flex flex-col items-center gap-2">
          <Music className="w-8 h-8 text-[#555555]" />
          <span className="font-bold text-white">Aún no has escuchado canciones</span>
          <span className="text-xs">Reproduce cualquier canción en Inicio o Buscar y tus estadísticas aparecerán aquí automáticamente.</span>
        </div>
      )}

      {/* Top 5 Canciones Ranking */}
      {stats.topTracks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-xl font-bold text-white">Top 5 Canciones Más Escuchadas</h2>
          </div>

          <div className="flex flex-col">
            {stats.topTracks.map((track, idx) => {
              const isThisPlaying = isPlaying && currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack?.(track)}
                  className="spotify-track-row flex items-center justify-between p-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 truncate">
                    <span className={`w-5 text-center text-sm font-black ${idx === 0 ? "text-[#f59e0b]" : idx === 1 ? "text-[#e5e5e5]" : idx === 2 ? "text-[#cd7f32]" : "text-[#757575]"}`}>
                      {idx + 1}
                    </span>

                    <img src={track.cover} alt={track.title} className="w-11 h-11 rounded object-cover shadow-sm flex-shrink-0" />

                    <div className="flex flex-col truncate">
                      <span className={`font-semibold text-sm truncate ${isThisPlaying ? "text-[var(--accent-color)]" : "text-white"}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-[#b3b3b3] font-mono">
                    <span>{track.playCount} {track.playCount === 1 ? "reproducción" : "reproducciones"}</span>
                    <span>{formatSeconds(track.totalSeconds)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Artistas */}
      {stats.topArtists.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white">Tus Artistas Principales</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {stats.topArtists.map((artist, idx) => (
              <div key={idx} className="spotify-card p-4 flex flex-col items-center text-center gap-2.5">
                <img src={artist.image} alt={artist.name} className="w-20 h-20 rounded-full object-cover shadow-md" />
                <span className="font-bold text-sm text-white truncate w-full">{artist.name}</span>
                <span className="text-xs text-[#b3b3b3]">{artist.playCount} temas reproducidos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datos Interesantes */}
      <div className="spotify-card p-5 rounded-xl border border-[#282828] flex flex-col gap-3 bg-[#161616]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent-color)]" />
          <h3 className="font-bold text-base text-white">Curiosidades de tu escucha en MMTOP</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#b3b3b3]">
          <div className="p-3 rounded bg-[#202020]">
            <span className="font-semibold text-white block mb-0.5">🎧 Audio 8D Espacial</span>
            <span>El motor 8D añade rotación binaural activa a tus temas para crear una experiencia de sonido 360°.</span>
          </div>
          <div className="p-3 rounded bg-[#202020]">
            <span className="font-semibold text-white block mb-0.5">⚡ Sin interrupciones</span>
            <span>Toda tu música suena 100% libre de anuncios y sin cortes de 30 segundos.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

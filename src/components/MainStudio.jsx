import React, { useState } from "react";
import JellyCanvas from "./JellyCanvas";
import { CloudRain, Hand, Sparkles, Droplets, Waves, Play, Pause, Volume2 } from "lucide-react";
import { audioEngine } from "../services/audioEngine";

export default function MainStudio({
  theme = "berry",
  isExtreme = false,
  onPlayTrack,
  currentTrack,
  isPlaying,
  curatedTracks = [],
}) {
  // ASMR triggers local active states & volumes
  const [triggers, setTriggers] = useState({
    rain: { active: false, volume: 0.6, name: "Lluvia Cristal", icon: CloudRain, color: "from-blue-500 to-cyan-400" },
    sand: { active: false, volume: 0.6, name: "Taps de Arena", icon: Hand, color: "from-amber-400 to-orange-500" },
    bubbles: { active: false, volume: 0.6, name: "Burbujas Gel", icon: Sparkles, color: "from-pink-500 to-fuchsia-600" },
    slime: { active: false, volume: 0.6, name: "Slime Viscoso", icon: Droplets, color: "from-emerald-400 to-teal-600" },
    waves: { active: false, volume: 0.6, name: "Olas Cósmicas", icon: Waves, color: "from-cyan-400 to-blue-600" },
  });

  const toggleTrigger = (id) => {
    const nextState = !triggers[id].active;
    audioEngine.toggleASMRTrigger(id, nextState);
    audioEngine.playJellyPop(nextState ? 500 : 320);

    setTriggers((prev) => ({
      ...prev,
      [id]: { ...prev[id], active: nextState },
    }));
  };

  const handleVolumeChange = (id, newVol) => {
    const val = parseFloat(newVol);
    audioEngine.setASMRVolume(id, val);
    setTriggers((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume: val },
    }));
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 pr-1 select-none">
      {/* Hero Card: Sintetizador de Fluido 3D / Mezclador ASMR 3D */}
      <div className="jelly-card p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6 shadow-[0_0_40px_rgba(255,45,117,0.2)]">
        {/* Left Information */}
        <div className="flex-1 flex flex-col items-start gap-4 z-10">
          <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-600/40 to-purple-600/40 border border-pink-400/40 text-[11px] font-extrabold uppercase tracking-widest text-pink-200 shadow-sm">
            SINTETIZADOR DE FLUIDO 3D
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            Mezclador <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-300">
              ASMR 3D
            </span>
          </h1>

          <p className="text-sm md:text-base text-white/70 max-w-md leading-relaxed">
            Mueve el ratón y haz clic en la masa gelatinosa para crear deformaciones e impulsos de partículas acústicas.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlayTrack?.(curatedTracks[0])}
              className="jelly-pill-btn px-6 py-3 text-sm font-bold text-white tracking-wide cursor-pointer flex items-center gap-2.5 shadow-pink-500/40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Reproducir Sesión Gel</span>
            </button>
            <span className="text-xs text-white/40 font-mono">100% Sin Publicidad</span>
          </div>
        </div>

        {/* Right 3D Jelly Canvas Container */}
        <div className="w-full lg:w-[420px] h-[230px] md:h-[260px] rounded-2xl bg-gradient-to-b from-white/10 to-black/30 border border-white/15 p-2 shadow-inner relative overflow-hidden">
          <JellyCanvas theme={theme} isExtreme={isExtreme} />
        </div>
      </div>

      {/* Section: Triggers ASMR Gelatinosos */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center">
              <span className="text-sm">🖐️</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow">
              Triggers ASMR Gelatinosos
            </h2>
          </div>

          <div className="jelly-sub-btn px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sintetizador Web Audio</span>
          </div>
        </div>

        {/* Triggers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {Object.entries(triggers).map(([id, t]) => {
            const Icon = t.icon;
            const isActive = t.active;

            return (
              <div
                key={id}
                className={`trigger-card p-4 flex flex-col justify-between gap-3 relative group transition-all duration-300 ${
                  isActive ? "active scale-[1.02]" : ""
                }`}
              >
                {/* Top Row: Icon + ON/OFF Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${t.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-5 h-5 text-white drop-shadow" />
                  </div>

                  <button
                    onClick={() => toggleTrigger(id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                      isActive
                        ? "bg-pink-500 text-white shadow-[0_0_12px_rgba(255,45,117,0.8)] border border-pink-300"
                        : "bg-black/40 text-white/50 border border-white/10 hover:text-white/80"
                    }`}
                  >
                    {isActive ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Bottom Row: Name + Volume Slider */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sm text-white/95 group-hover:text-pink-300 transition-colors">
                    {t.name}
                  </span>

                  {/* Volume Slider visible / subtle */}
                  <div className="flex items-center gap-2 pt-1">
                    <Volume2 className="w-3 h-3 text-white/40" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={t.volume}
                      onChange={(e) => handleVolumeChange(id, e.target.value)}
                      className="w-full h-1 bg-white/20 rounded-full accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Música & Frecuencias para Acompañar */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-extrabold text-white">
            Música Privada & Frecuencias 8D Recomendadas
          </h2>
          <span className="text-xs text-white/50">Audio Hi-Fi sin cortes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {curatedTracks.slice(0, 6).map((track) => {
            const isThisPlaying = isPlaying && currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack?.(track)}
                className="jelly-card p-3 flex items-center gap-3.5 cursor-pointer hover:border-pink-500/80 group transition-all"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <img
                    src={track.cover}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isThisPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 text-pink-400 fill-pink-400" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col truncate flex-1">
                  <span className="font-bold text-sm text-white group-hover:text-pink-300 truncate">
                    {track.title}
                  </span>
                  <span className="text-xs text-white/60 truncate">{track.artist}</span>
                  <span className="text-[10px] text-pink-400/80 font-mono mt-0.5">
                    Modo 8D Activado
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

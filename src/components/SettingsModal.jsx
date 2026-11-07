import React, { useState, useEffect, useRef } from "react";
import { X, Check, Headphones, Palette, Smartphone, Volume2, Sparkles, Layers, Moon, Download, Upload } from "lucide-react";
import { audioEngine } from "../services/audioEngine";
import { ACCENT_COLORS, PRESETS_8D } from "../constants/themeConstants";

export default function SettingsModal({
  isOpen,
  onClose,
  accentColor,
  setAccentColor,
  is8D,
  setIs8D,
}) {
  const [active8DPreset, setActive8DPreset] = useState(audioEngine.mode8D || "classic");
  const [speedVal, setSpeedVal] = useState(audioEngine.pannerSpeed || 0.035);
  const [depthVal, setDepthVal] = useState(audioEngine.spatialDepth || 0.9);
  const [reverbVal, setReverbVal] = useState(audioEngine.reverbAmount || 0.25);
  const [headShadow, setHeadShadow] = useState(audioEngine.headShadowEnabled);
  const [sleepEndsAt, setSleepEndsAt] = useState(audioEngine.state.sleepEndsAt);
  const importRef = useRef(null);

  useEffect(() => {
    return audioEngine.subscribe((s) => setSleepEndsAt(s.sleepEndsAt));
  }, []);

  if (!isOpen) return null;

  const handleSelectColor = (color) => {
    setAccentColor(color.hex);
    document.documentElement.style.setProperty("--accent-color", color.hex);
    document.documentElement.style.setProperty("--accent-color-hover", color.hover);
    document.documentElement.style.setProperty("--accent-color-press", color.press);
    localStorage.setItem("mmtop_accent_color", color.hex);
    audioEngine.playJellyPop(540);
  };

  const handleToggle8D = () => {
    const next = audioEngine.toggle8D();
    setIs8D(next);
  };

  const handleSelectPreset = (presetId) => {
    setActive8DPreset(presetId);
    audioEngine.set8DPreset(presetId);
    setSpeedVal(audioEngine.pannerSpeed);
    setDepthVal(audioEngine.spatialDepth);
    setReverbVal(audioEngine.reverbAmount);
    audioEngine.playJellyPop(580);
  };

  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setSpeedVal(val);
    audioEngine.set8DSpeed(val);
  };

  const handleDepthChange = (e) => {
    const val = parseFloat(e.target.value);
    setDepthVal(val);
    audioEngine.set8DDepth(val);
  };

  const handleReverbChange = (e) => {
    const val = parseFloat(e.target.value);
    setReverbVal(val);
    audioEngine.set8DReverb(val);
  };

  const handleSleep = (minutes) => {
    audioEngine.setSleepTimer(minutes);
    audioEngine.playJellyPop(minutes ? 600 : 350);
  };

  // Copia de seguridad: guarda likes, playlists, historial, estadísticas y ajustes en un archivo
  const handleExport = async () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("mmtop_")) data[k] = localStorage.getItem(k);
    }
    const json = JSON.stringify(
      { app: "MMTOP", version: 1, exportedAt: new Date().toISOString(), data },
      null,
      2
    );
    const fileName = `mmtop-copia-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], fileName, { type: "application/json" });
    try {
      // En iPhone se abre la hoja de compartir (guardar en Archivos, AirDrop, etc.)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Copia de seguridad MMTOP" });
        return;
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data;
      if (parsed?.app !== "MMTOP" || !data || typeof data !== "object") throw new Error("formato");
      if (!confirm("Esto reemplazará tus likes, playlists, historial y estadísticas actuales por los de la copia. ¿Continuar?")) return;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith("mmtop_") && typeof v === "string") localStorage.setItem(k, v);
      });
      window.location.reload();
    } catch (err) {
      alert("No se pudo leer ese archivo. Elige una copia exportada desde MMTOP.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const handleToggleHeadShadow = () => {
    const next = !headShadow;
    setHeadShadow(next);
    audioEngine.headShadowEnabled = next;
    audioEngine.save8DConfig();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#282828] rounded-xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282828] pb-4">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-xl font-bold text-white">Ajustes de MMTOP</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting 1: Accent Color */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-white flex items-center justify-between">
            <span>Color de la aplicación</span>
            <span className="text-xs text-[#b3b3b3]">
              {ACCENT_COLORS.find((c) => c.hex.toLowerCase() === accentColor.toLowerCase())?.name || "Personalizado"}
            </span>
          </label>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {ACCENT_COLORS.map((c) => {
              const isSelected = accentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectColor(c)}
                  title={c.name}
                  style={{ backgroundColor: c.hex }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer ${
                    isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#181818] scale-105" : ""
                  }`}
                >
                  {isSelected && (
                    <Check
                      className={`w-5 h-5 ${
                        c.id === "white" ? "text-black" : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Setting 2: Enhanced 8D Binaural Audio Suite (solo escritorio) */}
        {audioEngine.supports8D ? (
        <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#242424] border border-[#2e2e2e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] text-black flex items-center justify-center font-bold shadow">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Audio Espacial 8D</span>
                <span className="text-xs text-[#b3b3b3]">Sonido envolvente 360° para auriculares</span>
              </div>
            </div>

            <button
              onClick={handleToggle8D}
              style={{
                backgroundColor: is8D ? "var(--accent-color)" : "#3e3e3e",
                color: is8D ? "#000000" : "#ffffff",
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {is8D ? "ACTIVADO" : "DESACTIVADO"}
            </button>
          </div>

          {is8D && (
            <div className="flex flex-col gap-4 pt-2 border-t border-[#333333]">
              {/* Presets 8D */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  <span>Modos de Espacialización 8D</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS_8D.map((p) => {
                    const isSelected = active8DPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2f2f2f] border-[var(--accent-color)] shadow-sm"
                            : "bg-[#1f1f1f] border-transparent hover:bg-[#282828]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <span className="font-bold text-xs text-white">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-[#b3b3b3] block mt-1 leading-tight">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-3 pt-1">
                {/* Speed Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-[#b3b3b3]">
                    <span>Velocidad de giro orbital</span>
                    <span className="font-mono">{speedVal < 0.03 ? "Lenta" : speedVal > 0.05 ? "Rápida" : "Media"}</span>
                  </div>
                  <input
                    type="range"
                    min="0.015"
                    max="0.07"
                    step="0.005"
                    value={speedVal}
                    onChange={handleSpeedChange}
                    className="w-full h-1 bg-[#444444] rounded-full accent-[var(--accent-color)] cursor-pointer"
                  />
                </div>

                {/* Spatial Depth Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-[#b3b3b3]">
                    <span>Amplitud / Distancia 3D</span>
                    <span className="font-mono">{Math.round(depthVal * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={depthVal}
                    onChange={handleDepthChange}
                    className="w-full h-1 bg-[#444444] rounded-full accent-[var(--accent-color)] cursor-pointer"
                  />
                </div>

                {/* 3D Room Reverb Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-[#b3b3b3]">
                    <span>Reverberación de sala / Acústica</span>
                    <span className="font-mono">{Math.round(reverbVal * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.05"
                    value={reverbVal}
                    onChange={handleReverbChange}
                    className="w-full h-1 bg-[#444444] rounded-full accent-[var(--accent-color)] cursor-pointer"
                  />
                </div>

                {/* Head Shadow Acoustic Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Filtro de Sombra Craneal</span>
                    <span className="text-[10px] text-[#b3b3b3]">Simula la absorción acústica natural de la cabeza</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleHeadShadow}
                    style={{
                      backgroundColor: headShadow ? "var(--accent-color)" : "#3e3e3e",
                      color: headShadow ? "#000000" : "#ffffff",
                    }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                  >
                    {headShadow ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-xs text-[#b3b3b3]">
            <Headphones className="w-5 h-5 text-[#757575] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-white">Audio 8D no disponible en el móvil</span>
              <span>Se desactiva a propósito para que la música no se corte al bloquear la pantalla. Funciona en el ordenador.</span>
            </div>
          </div>
        )}

        {/* Setting 3: Mobile Background Playback Info */}
        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-xs text-[#b3b3b3]">
          <Smartphone className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-white">Reproducción con pantalla apagada activa</span>
            <span>MMTOP mantiene el audio activo en segundo plano cuando bloqueas el teléfono o cambias de app.</span>
          </div>
        </div>

        {/* Setting 4: Temporizador de apagado */}
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-[#242424] border border-[#2e2e2e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#333333] text-[var(--accent-color)] flex items-center justify-center shadow">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Temporizador de apagado</span>
              <span className="text-xs text-[#b3b3b3]">
                {sleepEndsAt
                  ? `Se apagará a las ${new Date(sleepEndsAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                  : "Para la música automáticamente pasado un tiempo"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSleep(m)}
                className="py-2 rounded-full text-xs font-bold bg-[#1f1f1f] text-white hover:bg-[#2f2f2f] cursor-pointer"
              >
                {m} min
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSleep(0)}
              style={{
                backgroundColor: sleepEndsAt ? "var(--accent-color)" : "#1f1f1f",
                color: sleepEndsAt ? "#000" : "#b3b3b3",
              }}
              className="py-2 rounded-full text-xs font-bold cursor-pointer"
            >
              Apagar
            </button>
          </div>
        </div>

        {/* Setting 5: Copia de seguridad */}
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-[#242424] border border-[#2e2e2e]">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Copia de seguridad</span>
            <span className="text-xs text-[#b3b3b3]">
              Likes, playlists, historial, estadísticas y ajustes se guardan solo en este navegador. Si Safari borra los datos, se pierden: exporta una copia de vez en cuando.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold bg-white text-black hover:scale-105 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold bg-[#1f1f1f] text-white hover:bg-[#2f2f2f] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar</span>
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            style={{ backgroundColor: "var(--accent-color)" }}
            className="px-6 py-2 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

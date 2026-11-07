import React from "react";
import {
  Search,
  Headphones,
  Smartphone,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  ArrowLeft,
  Home
} from "lucide-react";
import { audioEngine } from "../services/audioEngine";

export default function Header({
  activeTab = "home",
  searchQuery,
  setSearchQuery,
  is8D,
  setIs8D,
  onInstallPWA,
  onNavigateHome,
  onOpenSettings,
  onOpenCreatePlaylist,
  onBack,
}) {
  const handleToggle8D = () => {
    const next = audioEngine.toggle8D();
    setIs8D(next);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días!";
    if (hour < 20) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  };

  return (
    <header className="w-full bg-transparent select-none px-3 md:px-4 py-2.5 transition-all">
      {/* 1. Mobile Adaptive Top Header */}
      <div className="flex md:hidden items-center justify-between w-full gap-2">
        {activeTab === "home" && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-color)] animate-pulse" />
              <h1 className="text-xl font-black text-white tracking-tight">
                {getGreeting()}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggle8D}
                style={{
                  display: audioEngine.supports8D ? undefined : "none",
                  backgroundColor: is8D ? "var(--accent-color)" : "#282828",
                  color: is8D ? "#000000" : "#b3b3b3",
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>8D {is8D ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={onOpenSettings}
                title="Ajustes"
                className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {activeTab === "search" && (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 flex items-center rounded-full bg-[#242424] focus-within:bg-[#2a2a2a] focus-within:ring-2 focus-within:ring-white px-3 py-1.5 transition-all">
              <Search className="w-4 h-4 text-[#b3b3b3] mr-2 flex-shrink-0" />
              <input
                type="text"
                autoFocus={searchQuery ? false : true}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Artistas, canciones, podcasts..."
                className="w-full bg-transparent text-white placeholder-[#757575] text-sm outline-none font-normal"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="p-1 rounded-full text-[#b3b3b3] hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onOpenSettings}
              title="Ajustes"
              className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === "library" && (
          <>
            <h1 className="text-xl font-black text-white tracking-tight">
              Tu biblioteca
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreatePlaylist}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black font-bold text-xs active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Playlist</span>
              </button>
              <button
                onClick={onOpenSettings}
                title="Ajustes"
                className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {activeTab === "stats" && (
          <>
            <h1 className="text-xl font-black text-white tracking-tight">
              Tus estadísticas
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggle8D}
                style={{
                  display: audioEngine.supports8D ? undefined : "none",
                  backgroundColor: is8D ? "var(--accent-color)" : "#282828",
                  color: is8D ? "#000000" : "#b3b3b3",
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>8D {is8D ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={onOpenSettings}
                title="Ajustes"
                className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {activeTab === "artist" && (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={onBack || onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#282828] text-white text-xs font-bold active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <button
              onClick={onOpenSettings}
              title="Ajustes"
              className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Desktop Navigation Header */}
      <div className="hidden md:flex items-center justify-between gap-3 w-full">
        {/* Navigation arrows & Search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (activeTab === "artist" && onBack ? onBack() : window.history.back())}
              disabled={activeTab === "home"}
              title="Atrás"
              className={`w-8 h-8 rounded-full bg-black/60 flex items-center justify-center transition-colors ${
                activeTab === "home"
                  ? "text-[#b3b3b3]/30 cursor-not-allowed"
                  : "text-[#b3b3b3] hover:text-white cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.history.forward()}
              title="Adelante"
              className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-[#b3b3b3] hover:text-white cursor-pointer transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateHome}
              title="Inicio"
              className={`w-11 h-11 rounded-full bg-[#242424] hover:scale-105 flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "home" ? "text-white" : "text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative flex-1 flex items-center rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus-within:bg-[#2a2a2a] focus-within:ring-2 focus-within:ring-white px-4 py-3 transition-all">
            <Search className="w-4 h-4 text-[#b3b3b3] mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué quieres reproducir?"
              className="w-full bg-transparent text-white placeholder-[#757575] text-sm outline-none font-normal"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="p-1 rounded-full text-[#b3b3b3] hover:text-white ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: 8D Audio + Settings + Install App */}
        <div className="flex items-center gap-2.5">
          {/* 8D Audio Switch */}
          <button
            onClick={handleToggle8D}
            style={{
              backgroundColor: is8D ? "var(--accent-color)" : "#282828",
              color: is8D ? "#000000" : "#b3b3b3",
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Audio 8D</span>
            <span>{is8D ? "ON" : "OFF"}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Ajustes (Cambiar color y sonido)"
            className="w-8 h-8 rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          <button
            onClick={onInstallPWA}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instalar App</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Home, Search, Library, Plus, Heart, Folder, Settings, BarChart3, Disc } from "lucide-react";
import { audioEngine } from "../services/audioEngine";

export default function Sidebar({
  activeTab,
  setActiveTab,
  playlists = [],
  onOpenUpload,
  onSelectPlaylist,
  onOpenSettings,
}) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col gap-2 p-2 h-full select-none bg-black text-[#b3b3b3]">
      {/* Top Box: MMTOP Logo + Inicio + Buscar + Estadísticas */}
      <div className="bg-[#121212] rounded-lg p-5 flex flex-col gap-5">
        {/* MMTOP Brand */}
        <div
          onClick={() => {
            setActiveTab("home");
            audioEngine.playJellyPop();
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)] flex items-center justify-center text-black font-black text-sm shadow-md">
            MM
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-white tracking-tight">MMTOP</span>
            <span className="text-[10px] text-[#757575] font-semibold tracking-wider uppercase">Sin Anuncios</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-3.5">
          <button
            onClick={() => {
              setActiveTab("home");
              audioEngine.playJellyPop();
            }}
            className={`flex items-center gap-4 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "home" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Home className="w-6 h-6" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("search");
              audioEngine.playJellyPop();
            }}
            className={`flex items-center gap-4 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "search" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Search className="w-6 h-6" />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("stats");
              audioEngine.playJellyPop();
            }}
            className={`flex items-center gap-4 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "stats" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span>Estadísticas</span>
          </button>
        </div>
      </div>

      {/* Library & Playlists Box */}
      <div className="bg-[#121212] rounded-lg p-4 flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header with Title and Add Playlist Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActiveTab("library");
              audioEngine.playJellyPop();
            }}
            className="flex items-center gap-3 text-sm font-bold text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            <Library className="w-6 h-6" />
            <span>Tu biblioteca</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenUpload}
              title="Crear Playlist"
              className="p-1.5 rounded-full hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              title="Ajustes de Color & 8D"
              className="p-1.5 rounded-full hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Filter Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#232323] text-white">
            Playlists
          </span>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
          {/* Liked Songs Tile */}
          <button
            onClick={() => {
              setActiveTab("library");
              audioEngine.playJellyPop();
            }}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] text-left group transition-all"
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate group-hover:text-[var(--accent-color)] transition-colors">
                Tus Me Gusta
              </span>
              <span className="text-xs text-[#b3b3b3]">Playlist fija</span>
            </div>
          </button>

          {/* Local files shortcut */}
          <button
            onClick={() => {
              setActiveTab("library");
              audioEngine.playJellyPop();
            }}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] text-left group transition-all"
          >
            <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center text-[var(--accent-color)] flex-shrink-0 shadow-md">
              <Disc className="w-5 h-5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate group-hover:text-[var(--accent-color)] transition-colors">
                Archivos locales
              </span>
              <span className="text-xs text-[#b3b3b3]">Tus MP3 sin conexión</span>
            </div>
          </button>

          {/* Custom playlists */}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist?.(pl)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] text-left group transition-all"
            >
              <div
                style={{ backgroundColor: pl.color || "#282828" }}
                className="w-12 h-12 rounded flex items-center justify-center text-lg shadow-md flex-shrink-0"
              >
                {pl.emoji || "🎵"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-white truncate">
                  {pl.name}
                </span>
                <span className="text-xs text-[#b3b3b3]">{pl.tracks?.length || 0} canciones</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

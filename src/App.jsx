import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import SearchView from "./components/SearchView";
import LibraryView from "./components/LibraryView";
import StatsView from "./components/StatsView";
import PlayerBar from "./components/PlayerBar";
import MobileDrawerPlayer from "./components/MobileDrawerPlayer";
import SettingsModal from "./components/SettingsModal";
import ArtistProfileView from "./components/ArtistProfileView";
import { ACCENT_COLORS } from "./constants/themeConstants";
import PlaylistModal from "./components/PlaylistModal";
import QueueModal from "./components/QueueModal";
import { audioEngine } from "./services/audioEngine";
import { musicService, POPULAR_HITS } from "./services/musicService";
import { statsService } from "./services/statsService";
import { IMPORTED_PLAYLIST } from "./data/importedPlaylist.js";
import { Home, Search, Library, Settings, BarChart3, Smartphone, ListMusic, X } from "lucide-react";

const SESSION_KEY = "mmtop_last_session";

// Decide qué canción/cola debe haber al abrir la app:
// 1) la última sesión guardada, 2) la última canción escuchada, 3) tu playlist importada, 4) los éxitos por defecto.
function loadInitialSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (saved && Array.isArray(saved.queue) && saved.queue.length > 0) {
      const idx = Math.min(Math.max(saved.queueIndex || 0, 0), saved.queue.length - 1);
      return { queue: saved.queue, queueIndex: idx };
    }
  } catch (e) {}

  const playlistTracks = IMPORTED_PLAYLIST?.tracks || [];
  const recent = musicService.getRecentlyPlayed();
  if (recent.length > 0) {
    const i = playlistTracks.findIndex((t) => t.id === recent[0].id);
    if (i >= 0) return { queue: playlistTracks, queueIndex: i };
    return { queue: recent, queueIndex: 0 };
  }

  if (playlistTracks.length > 0) return { queue: playlistTracks, queueIndex: 0 };
  return { queue: POPULAR_HITS, queueIndex: 0 };
}

export default function App() {
  const [initialSession] = useState(loadInitialSession);

  const [accentColor, setAccentColor] = useState(
    localStorage.getItem("mmtop_accent_color") || "#1ed760"
  );
  const [is8D, setIs8D] = useState(true);
  const [activeTab, setActiveTab] = useState("home"); // "home" | "search" | "library" | "stats" | "artist"
  const [previousTab, setPreviousTab] = useState("home");
  const [selectedArtist, setSelectedArtist] = useState({ id: null, name: null });
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(
    JSON.parse(localStorage.getItem("mmtop_auto_advance") || "true")
  );

  const [playlistModalState, setPlaylistModalState] = useState({
    isOpen: false,
    mode: "create",
    trackToAdd: null,
  });

  // Audio queue & playback state (Continuous Playback: 1 detrás de otra)
  const [currentTrack, setCurrentTrack] = useState(initialSession.queue[initialSession.queueIndex]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState(initialSession.queue);
  const [queueIndex, setQueueIndex] = useState(initialSession.queueIndex);

  // Modo aleatorio: SIEMPRE activado al abrir la app
  const [isShuffle, setIsShuffle] = useState(true);
  const playedIdsRef = useRef(new Set()); // canciones ya sonadas en esta vuelta aleatoria (no se repiten hasta acabar la cola)
  const historyRef = useRef([]); // para el botón "anterior" en modo aleatorio
  const [isRepeat, setIsRepeat] = useState(false);
  const [toast, setToast] = useState(null); // aviso temporal { message, type }
  const errorSkipsRef = useRef(0); // canciones saltadas seguidas por error (máx. 3)

  // Favorites & Playlists (Persistent)
  const [likedMap, setLikedMap] = useState(musicService.likedTrackMap);
  const [playlists, setPlaylists] = useState(musicService.getPlaylists());
  const [selectedLibraryPlaylist, setSelectedLibraryPlaylist] = useState(null);
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Guardar la sesión (cola + canción actual) para recuperarla al volver a abrir la app
  useEffect(() => {
    try {
      // Las canciones locales usan blob: que caduca al cerrar la app, no se guardan
      const persistable = queue.filter((t) => t && t.sourceType !== "local");
      if (persistable.length === 0) return;
      let idx = persistable.findIndex((t) => t.id === currentTrack?.id);
      if (idx < 0) idx = 0;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ queue: persistable, queueIndex: idx }));
    } catch (e) {}
  }, [queue, queueIndex, currentTrack]);

  // Initialize saved accent color and browser history state
  useEffect(() => {
    const saved = localStorage.getItem("mmtop_accent_color") || "#1ed760";
    const matched = ACCENT_COLORS.find((c) => c.hex.toLowerCase() === saved.toLowerCase()) || ACCENT_COLORS[0];
    document.documentElement.style.setProperty("--accent-color", matched.hex);
    document.documentElement.style.setProperty("--accent-color-hover", matched.hover);
    document.documentElement.style.setProperty("--accent-color-press", matched.press);

    if (!window.history.state) {
      window.history.replaceState({ tab: "home" }, "");
    }
  }, []);

  // Browser History & Gesture Back Navigation (PopState)
  useEffect(() => {
    const handlePopState = (e) => {
      // 1. Modals have top priority
      if (isExpandedPlayerOpen) {
        setIsExpandedPlayerOpen(false);
        return;
      }
      if (isQueueOpen) {
        setIsQueueOpen(false);
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      if (playlistModalState.isOpen) {
        setPlaylistModalState((prev) => ({ ...prev, isOpen: false }));
        return;
      }
      // 2. Artist view returns to previous tab
      if (activeTab === "artist") {
        setActiveTab(previousTab || "home");
        return;
      }
      // 3. Tab navigation state
      if (e.state?.tab) {
        setActiveTab(e.state.tab);
      } else {
        setActiveTab("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    isExpandedPlayerOpen,
    isQueueOpen,
    isSettingsOpen,
    playlistModalState.isOpen,
    activeTab,
    previousTab,
  ]);

  // Listeners for audio, lockscreen, and continuous playback
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setIs8D(state.is8D);
      if (state.isPlaying) errorSkipsRef.current = 0;
    });

    // Automatic Continuous Playback: When song finishes, immediately plays the next one
    const handleTrackEnded = () => {
      if (isRepeat) {
        const same = queue[queueIndex] || audioEngine.state.currentTrack;
        if (same) audioEngine.playTrack(same);
        return;
      }
      if (autoAdvance) {
        handleNextTrack();
      }
    };
    const handlePlayError = (e) => {
      setToast({ message: e.detail?.message || "No se pudo reproducir la canción", type: "error" });
      // Si falla una canción, pasa a la siguiente (máximo 3 seguidas, para no encadenar errores sin fin)
      if (autoAdvance && queue.length > 1 && errorSkipsRef.current < 3) {
        errorSkipsRef.current += 1;
        setTimeout(() => {
          const failedId = e.detail?.track?.id;
          if (failedId && audioEngine.state.currentTrack?.id === failedId && !audioEngine.state.isPlaying) {
            handleNextTrack();
          }
        }, 1500);
      }
    };
    const handlePlayNotice = (e) => {
      if (e.detail?.message) setToast({ message: e.detail.message, type: "info" });
    };
    const handlePrevEvent = () => handlePrevTrack();
    const handleNextEvent = () => handleNextTrack();

    window.addEventListener("spotigel:track-ended", handleTrackEnded);
    window.addEventListener("mmtop:track-ended", handleTrackEnded);
    window.addEventListener("mmtop:prev-track", handlePrevEvent);
    window.addEventListener("mmtop:next-track", handleNextEvent);
    window.addEventListener("mmtop:play-error", handlePlayError);
    window.addEventListener("mmtop:play-notice", handlePlayNotice);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("spotigel:track-ended", handleTrackEnded);
      window.removeEventListener("mmtop:track-ended", handleTrackEnded);
      window.removeEventListener("mmtop:prev-track", handlePrevEvent);
      window.removeEventListener("mmtop:next-track", handleNextEvent);
      window.removeEventListener("mmtop:play-error", handlePlayError);
      window.removeEventListener("mmtop:play-notice", handlePlayNotice);
      unsubscribe();
    };
  }, [queue, queueIndex, autoAdvance, isShuffle, isRepeat]);

  // Título de la pestaña como Spotify: "Canción • Artista" mientras suena
  useEffect(() => {
    document.title =
      currentTrack && isPlaying
        ? `${currentTrack.title} • ${currentTrack.artist}`
        : "MMTOP - Tu música sin anuncios";
  }, [currentTrack, isPlaying]);

  // Atajos de teclado: Espacio = play/pausa, Ctrl+→ siguiente, Ctrl+← anterior
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (tag === "BUTTON") e.target.blur();
        handleTogglePlay();
      } else if (e.code === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrevTrack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // El aviso desaparece solo a los 4 segundos
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const pushHistory = (t) => {
    if (!t) return;
    const h = historyRef.current;
    if (h[h.length - 1]?.id !== t.id) h.push(t);
    if (h.length > 50) h.shift();
  };

  const handlePlayTrack = (track, startAt = 0) => {
    if (currentTrack && currentTrack.id !== track.id) pushHistory(currentTrack);
    playedIdsRef.current.add(track.id);
    setCurrentTrack(track);
    audioEngine.playTrack(track, startAt);

    const existingIdx = queue.findIndex((t) => t.id === track.id);
    if (existingIdx !== -1) {
      setQueueIndex(existingIdx);
    } else {
      setQueue([track, ...queue]);
      setQueueIndex(0);
    }
  };

  const handlePlayQueue = (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const safeIdx = Math.max(0, Math.min(startIndex, tracks.length - 1));
    if (currentTrack && currentTrack.id !== tracks[safeIdx].id) pushHistory(currentTrack);
    playedIdsRef.current = new Set([tracks[safeIdx].id]);
    setQueue(tracks);
    setQueueIndex(safeIdx);
    const track = tracks[safeIdx];
    setCurrentTrack(track);
    audioEngine.playTrack(track);
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (queue.length > 0) {
        handlePlayTrack(queue[0]);
      }
      return;
    }
    if (!isPlaying && !audioEngine.state.currentTrack) {
      // Primera vez tras abrir la app: retomar la canción por el segundo donde se dejó
      let startAt = 0;
      try {
        const pos = JSON.parse(localStorage.getItem("mmtop_last_position") || "null");
        if (pos && pos.id === currentTrack.id) startAt = pos.time || 0;
      } catch (e) {}
      handlePlayTrack(currentTrack, startAt);
      return;
    }
    audioEngine.togglePlay();
  };

  // Siguiente canción: aleatoria si el modo aleatorio está activo, si no, la siguiente de la cola
  const handleNextTrack = () => {
    if (queue.length === 0) return;
    const cur = queue[queueIndex] || currentTrack;
    let nextIdx;

    if (isShuffle && queue.length > 1) {
      if (cur) playedIdsRef.current.add(cur.id);
      const others = queue.map((_, i) => i).filter((i) => i !== queueIndex);
      let candidates = others.filter((i) => !playedIdsRef.current.has(queue[i].id));
      if (candidates.length === 0) {
        // Ya sonaron todas: empezar otra vuelta aleatoria
        playedIdsRef.current = new Set(cur ? [cur.id] : []);
        candidates = others;
      }
      nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      nextIdx = (queueIndex + 1) % queue.length;
    }

    pushHistory(cur);
    const nextTrack = queue[nextIdx];
    playedIdsRef.current.add(nextTrack.id);
    setQueueIndex(nextIdx);
    setCurrentTrack(nextTrack);
    audioEngine.playTrack(nextTrack);
  };

  const handlePrevTrack = () => {
    if (queue.length === 0) return;

    // En modo aleatorio, "anterior" vuelve a la canción que sonaba antes
    if (isShuffle && historyRef.current.length > 0) {
      const prev = historyRef.current.pop();
      const idx = queue.findIndex((t) => t.id === prev.id);
      if (idx >= 0) {
        setQueueIndex(idx);
        setCurrentTrack(queue[idx]);
        audioEngine.playTrack(queue[idx]);
        return;
      }
    }

    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    const prevTrack = queue[prevIdx];
    setCurrentTrack(prevTrack);
    audioEngine.playTrack(prevTrack);
  };

  const handleAddToQueue = (track) => {
    setQueue((prevQueue) => [...prevQueue, track]);
    audioEngine.playJellyPop(600);
  };

  const handleRemoveFromQueue = (index) => {
    const updated = queue.filter((_, idx) => idx !== index);
    setQueue(updated);
    if (index < queueIndex) {
      setQueueIndex(queueIndex - 1);
    }
  };

  const handleClearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  };

  const handleSelectArtist = (param) => {
    if (!param) return;
    setPreviousTab((prev) => (activeTab === "artist" ? prev : activeTab));
    if (typeof param === "object") {
      setSelectedArtist({ id: param.id || null, name: param.name || null });
    } else if (typeof param === "number" || (!isNaN(param) && !isNaN(parseFloat(param)))) {
      setSelectedArtist({ id: param, name: null });
    } else {
      setSelectedArtist({ id: null, name: String(param) });
    }
    window.history.pushState({ tab: "artist" }, "");
    setActiveTab("artist");
    audioEngine.playJellyPop(480);
  };

  const handleBackFromArtist = () => {
    if (window.history.state?.tab === "artist") {
      window.history.back();
    } else {
      setActiveTab(previousTab || "home");
    }
  };

  const handleNavigateTab = (tab) => {
    if (activeTab === tab) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch (e) {}
    }
    window.history.pushState({ tab }, "");
    setActiveTab(tab);
    audioEngine.playJellyPop();
  };

  const openExpandedPlayer = () => {
    window.history.pushState({ modal: "drawer" }, "");
    setIsExpandedPlayerOpen(true);
  };

  const closeExpandedPlayer = () => {
    if (window.history.state?.modal === "drawer") {
      window.history.back();
    } else {
      setIsExpandedPlayerOpen(false);
    }
  };

  const openSettings = () => {
    window.history.pushState({ modal: "settings" }, "");
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    if (window.history.state?.modal === "settings") {
      window.history.back();
    } else {
      setIsSettingsOpen(false);
    }
  };

  const openQueue = () => {
    window.history.pushState({ modal: "queue" }, "");
    setIsQueueOpen(true);
  };

  const closeQueue = () => {
    if (window.history.state?.modal === "queue") {
      window.history.back();
    } else {
      setIsQueueOpen(false);
    }
  };

  const openAddToPlaylist = (track) => {
    window.history.pushState({ modal: "playlist" }, "");
    setPlaylistModalState({
      isOpen: true,
      mode: "add_track",
      trackToAdd: track,
    });
  };

  const openCreatePlaylist = () => {
    window.history.pushState({ modal: "playlist" }, "");
    setPlaylistModalState({
      isOpen: true,
      mode: "create",
      trackToAdd: null,
    });
  };

  const closePlaylistModal = () => {
    if (window.history.state?.modal === "playlist") {
      window.history.back();
    } else {
      setPlaylistModalState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleToggleAutoAdvance = () => {
    const next = !autoAdvance;
    setAutoAdvance(next);
    localStorage.setItem("mmtop_auto_advance", JSON.stringify(next));
    audioEngine.playJellyPop(next ? 600 : 350);
  };

  const handleToggleShuffle = () => {
    const next = !isShuffle;
    setIsShuffle(next);
    audioEngine.playJellyPop(next ? 600 : 350);
  };

  const handleToggleRepeat = () => {
    const next = !isRepeat;
    setIsRepeat(next);
    audioEngine.playJellyPop(next ? 600 : 350);
  };

  // Toggle Like (Persistent)
  const handleToggleLike = (track) => {
    const isNowLiked = musicService.toggleLike(track);
    setLikedMap({ ...musicService.likedTrackMap });
    audioEngine.playJellyPop(isNowLiked ? 650 : 320);
  };

  const handleSearchChange = (q) => {
    setSearchQuery(q);
    if (q && activeTab !== "search") {
      handleNavigateTab("search");
    }
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("MMTOP installed");
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <div className="w-full h-dvh flex flex-col bg-black text-white overflow-hidden relative font-sans">
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-2 md:pb-[104px] md:gap-2 z-10 relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleNavigateTab}
            playlists={playlists}
            onOpenUpload={openCreatePlaylist}
            onSelectPlaylist={(pl) => {
              setSelectedLibraryPlaylist(pl);
              handleNavigateTab("library");
            }}
            onOpenSettings={openSettings}
          />
        </div>

        {/* Central Viewport */}
        <div
          style={
            activeTab === "home"
              ? {
                  backgroundImage:
                    "linear-gradient(180deg, color-mix(in srgb, var(--accent-color) 30%, #121212) 0px, #121212 340px)",
                }
              : undefined
          }
          className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#121212] md:rounded-lg"
        >
          <Header
            activeTab={activeTab}
            onBack={handleBackFromArtist}
            onOpenCreatePlaylist={openCreatePlaylist}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            is8D={is8D}
            setIs8D={setIs8D}
            onInstallPWA={handleInstallClick}
            onNavigateHome={() => handleNavigateTab("home")}
            onOpenSettings={openSettings}
          />

          {/* Active View */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === "home" && (
              <HomeView
                onTogglePlay={handleTogglePlay}
                onPlayTrack={handlePlayTrack}
                onPlayQueue={handlePlayQueue}
                onAddToQueue={handleAddToQueue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onNavigateSearch={(term) => {
                  if (term) setSearchQuery(term);
                  handleNavigateTab("search");
                }}
                onOpenAddToPlaylist={openAddToPlaylist}
                onToggleLike={handleToggleLike}
                isLiked={(id) => !!likedMap[id]}
                onSelectArtist={handleSelectArtist}
              />
            )}

            {activeTab === "search" && (
              <SearchView
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onPlayTrack={handlePlayTrack}
                onPlayQueue={handlePlayQueue}
                onAddToQueue={handleAddToQueue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onToggleLike={handleToggleLike}
                isLiked={(id) => !!likedMap[id]}
                onOpenAddToPlaylist={openAddToPlaylist}
                onSelectArtist={handleSelectArtist}
              />
            )}

            {activeTab === "artist" && (
              <ArtistProfileView
                artistId={selectedArtist.id}
                artistName={selectedArtist.name}
                onBack={handleBackFromArtist}
                onPlayTrack={handlePlayTrack}
                onPlayQueue={handlePlayQueue}
                onAddToQueue={handleAddToQueue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onToggleLike={handleToggleLike}
                isLiked={(id) => !!likedMap[id]}
                onOpenAddToPlaylist={openAddToPlaylist}
                onSelectArtist={handleSelectArtist}
              />
            )}

            {activeTab === "library" && (
              <LibraryView
                onPlayTrack={handlePlayTrack}
                onPlayQueue={handlePlayQueue}
                onAddToQueue={handleAddToQueue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onOpenCreatePlaylist={openCreatePlaylist}
                playlists={playlists}
                initialPlaylist={selectedLibraryPlaylist}
                onSelectPlaylist={setSelectedLibraryPlaylist}
                onDeletePlaylist={(id) => {
                  musicService.deletePlaylist(id);
                  setPlaylists([...musicService.getPlaylists()]);
                }}
              />
            )}

            {activeTab === "stats" && (
              <StatsView
                onPlayTrack={handlePlayTrack}
                onPlayQueue={handlePlayQueue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            )}
          </main>
        </div>
      </div>

      {/* Spotify-Style Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-[#242424]/80 px-4 py-1 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none">
        {/* Tab 1: Inicio */}
        <button
          onClick={() => handleNavigateTab("home")}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[60px] transition-all relative group cursor-pointer"
        >
          <Home
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "home" ? "text-white scale-110" : "text-[#8e8e8e] group-active:scale-95"
            }`}
          />
          <span
            className={`text-[10px] mt-1 transition-colors ${
              activeTab === "home" ? "text-white font-bold" : "text-[#8e8e8e]"
            }`}
          >
            Inicio
          </span>
          {activeTab === "home" && (
            <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] mt-0.5 shadow-[0_0_8px_var(--accent-color)]" />
          )}
        </button>

        {/* Tab 2: Buscar */}
        <button
          onClick={() => handleNavigateTab("search")}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[60px] transition-all relative group cursor-pointer"
        >
          <Search
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "search" ? "text-white scale-110" : "text-[#8e8e8e] group-active:scale-95"
            }`}
          />
          <span
            className={`text-[10px] mt-1 transition-colors ${
              activeTab === "search" ? "text-white font-bold" : "text-[#8e8e8e]"
            }`}
          >
            Buscar
          </span>
          {activeTab === "search" && (
            <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] mt-0.5 shadow-[0_0_8px_var(--accent-color)]" />
          )}
        </button>

        {/* Tab 3: Mi Playlist directa */}
        <button
          onClick={() => {
            const eldenPl = playlists.find(p => p.id === IMPORTED_PLAYLIST.id) || playlists[0];
            if (eldenPl) {
              setSelectedLibraryPlaylist(eldenPl);
            }
            handleNavigateTab("library");
          }}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[60px] transition-all relative group cursor-pointer"
        >
          <ListMusic
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "library" ? "text-[var(--accent-color)] scale-110" : "text-[#8e8e8e] group-active:scale-95"
            }`}
          />
          <span
            className={`text-[10px] mt-1 transition-colors ${
              activeTab === "library" ? "text-white font-bold" : "text-[#8e8e8e]"
            }`}
          >
            Mi Playlist
          </span>
          {activeTab === "library" && (
            <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] mt-0.5 shadow-[0_0_8px_var(--accent-color)]" />
          )}
        </button>

        {/* Tab 4: Tu biblioteca */}
        <button
          onClick={() => {
            setSelectedLibraryPlaylist(null);
            handleNavigateTab("library");
          }}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[60px] transition-all relative group cursor-pointer"
        >
          <Library
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "library" && !selectedLibraryPlaylist ? "text-white scale-110" : "text-[#8e8e8e] group-active:scale-95"
            }`}
          />
          <span
            className={`text-[10px] mt-1 transition-colors ${
              activeTab === "library" && !selectedLibraryPlaylist ? "text-white font-bold" : "text-[#8e8e8e]"
            }`}
          >
            Biblioteca
          </span>
        </button>
      </nav>

      {/* Aviso temporal (errores de reproducción, previews, copias de seguridad...) */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className={`fixed left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl cursor-pointer bottom-[calc(130px+env(safe-area-inset-bottom,0px))] md:bottom-28 ${
            toast.type === "error" ? "bg-red-500 text-white" : "bg-white text-black"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Persistent Bottom Floating Player */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isLiked={(id) => !!likedMap[id]}
        onToggleLike={handleToggleLike}
        onOpenExpanded={openExpandedPlayer}
        onOpenAddToPlaylist={openAddToPlaylist}
        onOpenQueue={openQueue}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        isRepeat={isRepeat}
        onToggleRepeat={handleToggleRepeat}
        onSelectArtist={handleSelectArtist}
      />

      {/* Fullscreen Mobile Drawer Player */}
      <MobileDrawerPlayer
        isOpen={isExpandedPlayerOpen}
        onClose={closeExpandedPlayer}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        isRepeat={isRepeat}
        onToggleRepeat={handleToggleRepeat}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isLiked={(id) => !!likedMap[id]}
        onToggleLike={handleToggleLike}
        onOpenAddToPlaylist={openAddToPlaylist}
        onSelectArtist={handleSelectArtist}
      />

      {/* Settings Modal (Color Accent & Enhanced 8D Presets) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        is8D={is8D}
        setIs8D={setIs8D}
      />

      {/* Playback Queue Modal (Continuous Playback 1 detrás de otra) */}
      <QueueModal
        isOpen={isQueueOpen}
        onClose={closeQueue}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queue={queue}
        queueIndex={queueIndex}
        onSelectTrackIndex={(idx) => {
          setQueueIndex(idx);
          handlePlayTrack(queue[idx]);
        }}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        autoAdvance={autoAdvance}
        onToggleAutoAdvance={handleToggleAutoAdvance}
      />

      {/* Playlist Creation / Add Track Modal */}
      <PlaylistModal
        isOpen={playlistModalState.isOpen}
        mode={playlistModalState.mode}
        trackToAdd={playlistModalState.trackToAdd}
        playlists={playlists}
        onClose={closePlaylistModal}
        onPlaylistCreated={() => setPlaylists([...musicService.getPlaylists()])}
        onTrackAdded={() => setPlaylists([...musicService.getPlaylists()])}
      />

      {/* PWA Mobile Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#282828] rounded-lg p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-black shadow-lg">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white">Instalar MMTOP en tu Móvil</h3>
              <p className="text-xs text-[#b3b3b3] mt-1 leading-relaxed">
                Instala la app en tu teléfono para reproducir música sin anuncios y con pantalla apagada:
              </p>
            </div>

            <div className="flex flex-col gap-2.5 p-3 rounded bg-[#181818] border border-[#3e3e3e] text-xs text-white">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[var(--accent-color)]">En iPhone (Safari):</span>
                <span>Toca <strong>Compartir</strong> y selecciona <strong>"Añadir a pantalla de inicio"</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[var(--accent-color)]">En Android (Chrome):</span>
                <span>Toca los 3 puntos superiores y pulsa <strong>"Instalar aplicación"</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              style={{ backgroundColor: "var(--accent-color)" }}
              className="w-full py-2.5 rounded-full text-black font-bold text-xs hover:scale-105 transition-all cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

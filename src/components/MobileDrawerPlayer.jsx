import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Headphones,
  Repeat,
  Shuffle,
  Plus,
  MoreHorizontal,
  ListMusic,
} from "lucide-react";
import { audioEngine } from "../services/audioEngine";

export default function MobileDrawerPlayer({
  isOpen,
  onClose,
  isShuffle = true,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isLiked,
  onToggleLike,
  onOpenAddToPlaylist,
  onSelectArtist,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [is8D, setIs8D] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);
  const [imgError, setImgError] = useState(false);
  const artRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    setTouchStartY(null);
    if (diffY > 60) {
      if (navigator.vibrate) try { navigator.vibrate(10); } catch (err) {}
      onClose();
    }
  };

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      if (!isDragging) setCurrentTime(state.currentTime);
      setDuration(state.duration);
      setIs8D(state.is8D);
    });
    return unsubscribe;
  }, [isDragging]);

  // Reset img error on track change
  useEffect(() => { setImgError(false); }, [currentTrack?.id]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeekChange = (e) => {
    setIsDragging(true);
    setDragValue(parseFloat(e.target.value));
  };

  const handleSeekCommit = (e) => {
    const val = parseFloat(e.target.value);
    setIsDragging(false);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleToggle8D = () => {
    const next = audioEngine.toggle8D();
    setIs8D(next);
  };

  const liked = isLiked?.(currentTrack.id);
  const activeTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (activeTime / duration) * 100)) : 0;

  const coverSrc = imgError
    ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80"
    : currentTrack.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #1a1a2e 0%, #121212 45%, #121212 100%)" }}
    >
      {/* Blurred background art */}
      <div
        className="absolute inset-0 opacity-30 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${coverSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-all"
          >
            <ChevronDown className="w-7 h-7" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase font-bold tracking-widest text-[#b3b3b3]">
              Reproduciendo
            </span>
            {currentTrack.album && (
              <span className="text-xs font-semibold text-white truncate max-w-[180px] text-center">
                {currentTrack.album}
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenAddToPlaylist?.(currentTrack)}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-all"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Album Art — large, centered, with shadow */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-6">
          <div
            ref={artRef}
            className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isPlaying ? "scale-100" : "scale-90"}`}
            style={{
              width: "min(72vw, 320px)",
              height: "min(72vw, 320px)",
              boxShadow: isPlaying
                ? "0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)"
                : "0 16px 32px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src={coverSrc}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        </div>

        {/* Track Info + Like */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
            <span className="font-black text-xl text-white truncate leading-tight">
              {currentTrack.title}
            </span>
            <button
              onClick={() => {
                onClose();
                onSelectArtist?.(currentTrack.artistId || currentTrack.artist);
              }}
              className="text-sm font-semibold text-[#b3b3b3] truncate hover:text-white text-left transition-colors mt-0.5"
            >
              {currentTrack.artist}
            </button>
          </div>

          <button
            onClick={() => onToggleLike?.(currentTrack)}
            className="p-2 flex-shrink-0 active:scale-90 transition-transform"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                liked
                  ? "fill-[var(--accent-color)] text-[var(--accent-color)]"
                  : "text-[#b3b3b3] hover:text-white"
              }`}
            />
          </button>
        </div>

        {/* Progress Scrubber */}
        <div className="flex flex-col gap-1 mb-5">
          <div className="relative w-full h-8 flex items-center group">
            <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%`, backgroundColor: "var(--accent-color)" }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              step="0.1"
              value={activeTime}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="absolute w-full opacity-0 h-8 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            {/* Visible thumb */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white shadow-lg pointer-events-none transition-all"
              style={{ left: `calc(${progressPercent}% - 6px)`, zIndex: 1 }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-[#b3b3b3]">
            <span>{formatTime(activeTime)}</span>
            <span>{currentTrack.durationStr || formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Shuffle */}
          <button
            onClick={() => onToggleShuffle?.()}
            className={`p-2 transition-colors active:scale-90 ${isShuffle ? "text-[var(--accent-color)]" : "text-[#b3b3b3] hover:text-white"}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Prev */}
          <button
            onClick={onPrev}
            className="p-2 text-white hover:text-white/80 active:scale-90 transition-all"
          >
            <SkipBack className="w-9 h-9 fill-current" />
          </button>

          {/* Play / Pause — big green Spotify-style */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center rounded-full text-black active:scale-95 transition-transform shadow-2xl"
            style={{
              width: 68,
              height: 68,
              backgroundColor: "var(--accent-color)",
              boxShadow: "0 8px 24px rgba(29,215,96,0.4)",
            }}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-black text-black" />
            ) : (
              <Play className="w-7 h-7 fill-black text-black ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            className="p-2 text-white hover:text-white/80 active:scale-90 transition-all"
          >
            <SkipForward className="w-9 h-9 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={() => onToggleRepeat?.()}
            className={`p-2 transition-colors active:scale-90 ${isRepeat ? "text-[var(--accent-color)]" : "text-[#b3b3b3] hover:text-white"}`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* 8D solo en escritorio: en móvil está desactivado para no perder el audio con la pantalla bloqueada.
            (El volumen se controla con los botones físicos del iPhone.) */}
        {audioEngine.supports8D && (
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleToggle8D}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
              style={{
                backgroundColor: is8D ? "var(--accent-color)" : "rgba(255,255,255,0.1)",
                color: is8D ? "#000" : "#fff",
              }}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>8D</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

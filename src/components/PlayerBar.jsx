import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  Headphones,
  Plus,
  ListMusic
} from "lucide-react";
import { audioEngine } from "../services/audioEngine";

export default function PlayerBar({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isLiked,
  onToggleLike,
  onOpenExpanded,
  onOpenAddToPlaylist,
  onOpenQueue,
  isShuffle = true,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
  onSelectArtist,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [is8D, setIs8D] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const handleMiniTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleMiniTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    setTouchStartX(null);
    setTouchStartY(null);

    // If swipe is mostly horizontal and > 45px
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe Left -> Next
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (err) {}
        onNext?.();
      } else {
        // Swipe Right -> Prev
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (err) {}
        onPrev?.();
      }
    }
  };

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      if (!isDragging) {
        setCurrentTime(state.currentTime);
      }
      setDuration(state.duration);
      setVolume(state.volume);
      setIsMuted(state.isMuted);
      setIs8D(state.is8D);
    });
    return unsubscribe;
  }, [isDragging]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setIsDragging(true);
    setDragValue(val);
  };

  const handleSeekCommit = (e) => {
    const val = parseFloat(e.target.value);
    setIsDragging(false);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
    audioEngine.setVolume(val);
  };

  const handleMute = () => {
    audioEngine.toggleMute();
  };

  if (!currentTrack) return null;

  const liked = isLiked?.(currentTrack.id);
  const activeCurrentTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (activeCurrentTime / duration) * 100)) : 0;
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.min(100, Math.max(0, effectiveVolume * 100));

  return (
    <>
      {/* 1. Mobile Floating Mini-Player (Spotify-Style Pill above navigation tabs with Swipe-to-Skip) */}
      <div
        onClick={onOpenExpanded}
        onTouchStart={handleMiniTouchStart}
        onTouchEnd={handleMiniTouchEnd}
        className="md:hidden fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-2 right-2 z-40 bg-[#242424]/95 backdrop-blur-md rounded-lg p-2 shadow-2xl flex items-center justify-between border border-white/10 select-none cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* Progress Line */}
        <div className="absolute top-0 left-2 right-2 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-color)] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Thumbnail & Song Info */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-xs">
              {currentTrack.title}
            </span>
            <span className="text-[11px] text-[#b3b3b3] truncate max-w-[170px] sm:max-w-xs">
              {currentTrack.artist}
            </span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleLike?.(currentTrack)}
            className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-[var(--accent-color)] text-[var(--accent-color)]" : ""}`} />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Bottom Player Bar */}
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-[#282828] px-4 items-center justify-between z-50 select-none">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-1/4 min-w-[160px] truncate">
          <div
            onClick={onOpenExpanded}
            className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0 cursor-pointer shadow-md group"
          >
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex flex-col truncate pr-2">
            <span
              onClick={onOpenExpanded}
              className="font-medium text-sm text-white hover:underline truncate cursor-pointer"
            >
              {currentTrack.title}
            </span>
            <span
              onClick={() => onSelectArtist?.(currentTrack.artistId || currentTrack.artist)}
              className="text-xs text-[#b3b3b3] hover:underline hover:text-white truncate cursor-pointer"
            >
              {currentTrack.artist}
            </span>
            {is8D && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-color)] font-semibold">
                <Headphones className="w-3 h-3" /> 8D Spatial
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggleLike?.(currentTrack)}
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-[var(--accent-color)] text-[var(--accent-color)]" : ""}`} />
            </button>
            <button
              onClick={() => onOpenAddToPlaylist?.(currentTrack)}
              title="Añadir a playlist"
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-2">
          {/* Buttons Row */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onToggleShuffle?.()}
              className={`transition-colors ${
                isShuffle ? "text-[var(--accent-color)]" : "text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrev}
              className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Circular Play Button */}
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => onToggleRepeat?.()}
              className={`transition-colors ${
                isRepeat ? "text-[var(--accent-color)]" : "text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="w-full flex items-center gap-2.5 text-xs font-mono text-[#b3b3b3]">
            <span className="w-9 text-right">{formatTime(activeCurrentTime)}</span>
            <div className="relative flex-1 group py-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 100}
                step="0.1"
                value={activeCurrentTime}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                onKeyUp={handleSeekCommit}
                style={{
                  background: `linear-gradient(to right, var(--accent-color) ${progressPercent}%, #4d4d4d ${progressPercent}%)`
                }}
                className="spotify-slider w-full cursor-pointer"
              />
            </div>
            <span className="w-9 text-left">{currentTrack.durationStr || formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume, Queue & Extras */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Queue Button */}
          <button
            onClick={onOpenQueue}
            title="Cola de reproducción (1 detrás de otra)"
            className="p-1 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          <button onClick={handleMute} className="text-[#b3b3b3] hover:text-white cursor-pointer">
            {isMuted || effectiveVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="group flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectiveVolume}
              onChange={handleVolume}
              style={{
                background: `linear-gradient(to right, var(--accent-color) ${volumePercent}%, #4d4d4d ${volumePercent}%)`
              }}
              className="spotify-slider w-24 cursor-pointer"
            />
          </div>

          <button
            onClick={onOpenExpanded}
            className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </>
  );
}

// audioEngine: MMTOP Advanced Audio Hub with Enhanced 8D Spatial Audio, Reverb Room Simulation, and MediaSession

import { statsService } from "./statsService";
import { musicService } from "./musicService";

class AudioEngine {
  constructor() {
    // En móvil no se usa Web Audio (para no perder el audio con la pantalla bloqueada), así que el 8D no está disponible
    this.isMobile = typeof navigator !== "undefined" && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
    );
    this.supports8D = !this.isMobile;
    this.pendingSeek = 0; // segundo al que saltar cuando cargue la canción (reanudar donde lo dejaste)
    this.sleepTimeout = null;
    this.audioCtx = null;
    this.audioElement = new Audio();
    this.audioElement.preload = "auto";
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.setAttribute("playsinline", "true");
    this.audioElement.setAttribute("webkit-playsinline", "true");
    this.audioElement.setAttribute("x-webkit-airplay", "allow");

    // Keep-alive silencioso solo para el motor de YouTube (el <audio> normal ya mantiene la sesión en iOS).
    // OJO: iOS ignora audio.volume, por eso NO se puede usar una canción real aquí (antes sonaba Columbia de fondo).
    this.bgKeeper = new Audio("/keepalive.wav");
    this.bgKeeper.loop = true;
    this.bgKeeper.volume = 0.0001;
    this.bgKeeper.setAttribute("playsinline", "true");
    this.bgKeeper.setAttribute("webkit-playsinline", "true");
    this.userPaused = false;

    // Audio Graph Nodes
    this.sourceNode = null;
    this.analyser = null;
    this.panner = null;
    this.filterNode = null;
    this.reverbDelay = null;
    this.reverbGain = null;
    this.masterGain = null;

    // 8D Engine Configuration & Presets
    const saved8D = JSON.parse(localStorage.getItem("mmtop_8d_config") || "{}");
    this.is8DEnabled = saved8D.enabled !== undefined ? saved8D.enabled : true;
    this.mode8D = saved8D.mode || "classic"; // "classic" | "vortex" | "concert" | "deep"
    this.pannerSpeed = saved8D.speed !== undefined ? saved8D.speed : 0.035;
    this.spatialDepth = saved8D.depth !== undefined ? saved8D.depth : 0.9;
    this.reverbAmount = saved8D.reverb !== undefined ? saved8D.reverb : 0.25;
    this.headShadowEnabled = saved8D.headShadow !== undefined ? saved8D.headShadow : true;

    this.pannerAngle = 0;
    this.animationFrame = null;

    // YouTube Player reference
    this.ytPlayer = null;
    this.isYouTube = false;
    this.activeEngine = null; // "audio" | "youtube" | null

    // Periodic stats timer
    this.statsInterval = null;

    this.listeners = new Set();
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      is8D: this.is8DEnabled && !this.isMobile,
      mode8D: this.mode8D,
      speed8D: this.pannerSpeed,
      depth8D: this.spatialDepth,
      reverb8D: this.reverbAmount,
      currentTrack: null,
      sleepEndsAt: null,
    };

    this.setupAudioElementListeners();
    this.startStatsTracker();
    if (typeof window !== "undefined") {
      this.initBackgroundPlayer();
      window.addEventListener("pagehide", () => this.savePosition());
    }
  }

  save8DConfig() {
    try {
      localStorage.setItem("mmtop_8d_config", JSON.stringify({
        enabled: this.is8DEnabled,
        mode: this.mode8D,
        speed: this.pannerSpeed,
        depth: this.spatialDepth,
        reverb: this.reverbAmount,
        headShadow: this.headShadowEnabled,
      }));
    } catch (e) {}
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.state.volume;

      // 1. Stereo Panner for 360° binaural rotation
      if (this.audioCtx.createStereoPanner) {
        this.panner = this.audioCtx.createStereoPanner();
      }

      // 2. Head-Shadow Acoustic Filter
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 18000;

      // 3. Concert Hall / 3D Room Reverb Simulator
      this.reverbDelay = this.audioCtx.createDelay();
      this.reverbDelay.delayTime.value = 0.038; // 38ms room reflection

      this.reverbGain = this.audioCtx.createGain();
      this.reverbGain.gain.value = this.reverbAmount;

      const isMobile = typeof navigator !== "undefined" && (
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
      );

      // On mobile devices, keep HTML5 <audio> directly connected to native hardware
      // to preserve background playback & prevent iOS/Android AudioContext suspension on lock screen!
      if (!isMobile) {
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

          if (this.panner) {
            this.sourceNode.connect(this.panner);
            this.panner.connect(this.filterNode);
            this.filterNode.connect(this.analyser);

            // Connect 3D spatial room reflection loop
            this.filterNode.connect(this.reverbDelay);
            this.reverbDelay.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);
          } else {
            this.sourceNode.connect(this.analyser);
          }

          this.analyser.connect(this.masterGain);
          this.masterGain.connect(this.audioCtx.destination);
        } catch (err) {
          console.warn("Audio node setup notice:", err);
        }

        this.start8DLoop();
      }
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  start8DLoop() {
    const loop = () => {
      if (this.is8DEnabled && this.panner && this.state.isPlaying && this.audioCtx) {
        // Adjust dynamics based on preset
        let currentSpeed = this.pannerSpeed;
        if (this.mode8D === "vortex") currentSpeed = this.pannerSpeed * 1.8;
        else if (this.mode8D === "deep") currentSpeed = this.pannerSpeed * 0.6;

        this.pannerAngle += currentSpeed;

        // Smooth orbital panning
        const panValue = Math.sin(this.pannerAngle) * this.spatialDepth;
        this.panner.pan.setTargetAtTime(panValue, this.audioCtx.currentTime, 0.05);

        // Head-shadow acoustic filter modulation
        if (this.filterNode && this.headShadowEnabled) {
          let baseFreq = 16000;
          if (this.mode8D === "deep") baseFreq = 12000;
          const freqMod = baseFreq - Math.abs(panValue) * 4500;
          this.filterNode.frequency.setTargetAtTime(Math.max(2000, freqMod), this.audioCtx.currentTime, 0.05);
        }
      }
      this.animationFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  // Set 8D Preset Mode
  set8DPreset(modeName) {
    this.mode8D = modeName;
    this.state.mode8D = modeName;

    if (modeName === "classic") {
      this.pannerSpeed = 0.035;
      this.spatialDepth = 0.9;
      this.reverbAmount = 0.2;
    } else if (modeName === "vortex") {
      this.pannerSpeed = 0.055;
      this.spatialDepth = 1.0;
      this.reverbAmount = 0.35;
    } else if (modeName === "concert") {
      this.pannerSpeed = 0.025;
      this.spatialDepth = 0.85;
      this.reverbAmount = 0.65;
    } else if (modeName === "deep") {
      this.pannerSpeed = 0.02;
      this.spatialDepth = 0.95;
      this.reverbAmount = 0.15;
    }

    if (this.reverbGain && this.audioCtx) {
      this.reverbGain.gain.setTargetAtTime(this.reverbAmount, this.audioCtx.currentTime, 0.05);
    }

    this.state.speed8D = this.pannerSpeed;
    this.state.depth8D = this.spatialDepth;
    this.state.reverb8D = this.reverbAmount;

    this.save8DConfig();
    this.notify();
  }

  set8DSpeed(val) {
    // Range 0.01 to 0.08
    this.pannerSpeed = Math.max(0.01, Math.min(0.08, val));
    this.state.speed8D = this.pannerSpeed;
    this.save8DConfig();
    this.notify();
  }

  set8DDepth(val) {
    // Range 0.2 to 1.0
    this.spatialDepth = Math.max(0.2, Math.min(1.0, val));
    this.state.depth8D = this.spatialDepth;
    this.save8DConfig();
    this.notify();
  }

  set8DReverb(val) {
    this.reverbAmount = Math.max(0, Math.min(1.0, val));
    this.state.reverb8D = this.reverbAmount;
    if (this.reverbGain && this.audioCtx) {
      this.reverbGain.gain.setTargetAtTime(this.reverbAmount, this.audioCtx.currentTime, 0.05);
    }
    this.save8DConfig();
    this.notify();
  }

  toggle8D(forceState) {
    this.is8DEnabled = forceState !== undefined ? forceState : !this.is8DEnabled;
    this.state.is8D = this.is8DEnabled && this.supports8D;

    if (!this.is8DEnabled && this.panner && this.audioCtx) {
      this.panner.pan.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      if (this.filterNode) {
        this.filterNode.frequency.setTargetAtTime(20000, this.audioCtx.currentTime, 0.05);
      }
    }
    this.save8DConfig();
    this.notify();
    return this.is8DEnabled;
  }

  // ---- Reanudar donde lo dejaste ----
  savePosition() {
    try {
      const t = this.state.currentTrack;
      if (!t || !(this.state.currentTime > 0)) return;
      localStorage.setItem(
        "mmtop_last_position",
        JSON.stringify({ id: t.id, time: Math.floor(this.state.currentTime) })
      );
    } catch (e) {}
  }

  // ---- Caché de videoId (evita buscar en YouTube cada vez que suena una canción) ----
  _videoCacheKey(track) {
    return track.id || ((track.artist || "") + "|" + (track.title || "")).toLowerCase();
  }

  getCachedVideoId(track) {
    try {
      const map = JSON.parse(localStorage.getItem("mmtop_video_cache") || "{}");
      return map[this._videoCacheKey(track)] || null;
    } catch (e) {
      return null;
    }
  }

  cacheVideoId(track, videoId) {
    try {
      const map = JSON.parse(localStorage.getItem("mmtop_video_cache") || "{}");
      map[this._videoCacheKey(track)] = videoId;
      const keys = Object.keys(map);
      if (keys.length > 800) delete map[keys[0]];
      localStorage.setItem("mmtop_video_cache", JSON.stringify(map));
    } catch (e) {}
  }

  uncacheVideoId(track) {
    try {
      const map = JSON.parse(localStorage.getItem("mmtop_video_cache") || "{}");
      delete map[this._videoCacheKey(track)];
      localStorage.setItem("mmtop_video_cache", JSON.stringify(map));
    } catch (e) {}
  }

  // Si no hay forma de sacar el audio completo: preview de 30 s si existe, o aviso de error
  fallbackOrError(track) {
    // Evita bucles (YouTube falla -> preview falla -> YouTube...): solo se intenta el respaldo una vez por reproducción
    if (!this._fallbackTried) this._fallbackTried = new WeakSet();
    const alreadyTried = this._fallbackTried.has(track);
    this._fallbackTried.add(track);
    if (track.fallbackPreview && !alreadyTried) {
      this.playAudioElement(track, track.fallbackPreview);
      this.emitEvent("play-notice", {
        message: `"${track.title}" solo está disponible como preview de 30 s`,
      });
      return;
    }
    this.state.isPlaying = false;
    this.notify();
    this.emitEvent("play-error", { track, message: `No se pudo reproducir "${track.title}"` });
  }

  // ---- Temporizador de apagado ----
  setSleepTimer(minutes) {
    if (this.sleepTimeout) {
      clearTimeout(this.sleepTimeout);
      this.sleepTimeout = null;
    }
    if (!minutes || minutes <= 0) {
      this.state.sleepEndsAt = null;
      this.notify();
      return;
    }
    this.state.sleepEndsAt = Date.now() + minutes * 60000;
    this.sleepTimeout = setTimeout(() => {
      this.sleepTimeout = null;
      this.state.sleepEndsAt = null;
      if (this.state.isPlaying) {
        this.togglePlay();
      } else {
        this.notify();
      }
    }, minutes * 60000);
    this.notify();
  }

  startStatsTracker() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(() => {
      if (this.state.isPlaying && this.state.currentTrack) {
        statsService.recordListeningSecond(this.state.currentTrack, 1);
        this._posTick = (this._posTick || 0) + 1;
        if (this._posTick >= 5) {
          this._posTick = 0;
          this.savePosition();
        }
      }
    }, 1000);
  }

  setupAudioElementListeners() {
    this.audioElement.addEventListener("play", () => {
      if (this.activeEngine !== "audio") return;
      this.state.isPlaying = true;
      this.updateMediaSessionState("playing");
      this.notify();
    });

    this.audioElement.addEventListener("pause", () => {
      if (this.activeEngine !== "audio") return;
      this.state.isPlaying = false;
      this.updateMediaSessionState("paused");
      this.notify();
    });

    this.audioElement.addEventListener("ended", () => {
      if (this.activeEngine !== "audio") return;
      this.state.isPlaying = false;
      this.notify();
      this.emitEvent("track-ended");
    });

    this.audioElement.addEventListener("timeupdate", () => {
      if (this.activeEngine !== "audio") return;
      this.state.currentTime = this.audioElement.currentTime;
      this.state.duration = this.audioElement.duration || 0;
      this.updateMediaSessionPosition();
      this.notify();
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      if (this.activeEngine !== "audio") return;
      this.state.duration = this.audioElement.duration || 0;
      if (this.pendingSeek > 0) {
        try {
          const max = (this.audioElement.duration || Infinity) - 2;
          this.audioElement.currentTime = Math.min(this.pendingSeek, max);
        } catch (e) {}
        this.pendingSeek = 0;
      }
      this.notify();
    });

    this.audioElement.addEventListener("error", (e) => {
      // Al cambiar de motor se vacía el src y algunos navegadores lanzan un error falso: ignorarlo
      if (this.activeEngine !== "audio" || !this.audioElement.getAttribute("src")) return;
      console.warn("Audio element error:", this.audioElement.error?.message || this.audioElement.error);
      const track = this.state.currentTrack;
      if (!track) return;

      // Fallback to background YouTube embed if HTML5 audio fails
      if (track.videoId) {
        console.info("Falling back to background YouTube embed...");
        this._streamFailedFor = track.videoId; // no volver a intentar el stream de este vídeo (evita bucles)
        this.initBackgroundPlayer();
        this.playBackgroundVideo(track.videoId);
        return;
      }

      if (track.artist && track.title) {
        fetch(`/api/resolve?q=${encodeURIComponent(track.artist + ' ' + track.title)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d && d.videoId) {
              track.videoId = d.videoId;
              this.cacheVideoId(track, d.videoId);
              this.initBackgroundPlayer();
              this.playBackgroundVideo(d.videoId);
            } else {
              this.fallbackOrError(track);
            }
          })
          .catch(() => this.fallbackOrError(track));
        return;
      }

      this.fallbackOrError(track);
    });
  }

  updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || "MMTOP",
        artwork: [
          { src: track.cover, sizes: "96x96", type: "image/jpeg" },
          { src: track.cover, sizes: "192x192", type: "image/jpeg" },
          { src: track.cover, sizes: "512x512", type: "image/jpeg" }
        ]
      });

      navigator.mediaSession.setActionHandler("play", () => {
        this.userPaused = false;
        this.togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        this.userPaused = true;
        this.togglePlay();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => this.emitEvent("prev-track"));
      navigator.mediaSession.setActionHandler("nexttrack", () => this.emitEvent("next-track"));
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.max(0, this.state.currentTime - offset));
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.min(this.state.duration, this.state.currentTime + offset));
      });
    } catch (e) {}
  }

  updateMediaSessionState(playbackState) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playbackState;
    }
  }

  updateMediaSessionPosition() {
    if ('mediaSession' in navigator && this.state.duration > 0 && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({
          duration: this.state.duration,
          playbackRate: 1.0,
          position: Math.min(this.state.currentTime, this.state.duration)
        });
      } catch (e) {}
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  emitEvent(name, data) {
    window.dispatchEvent(new CustomEvent(`mmtop:${name}`, { detail: data }));
  }

  initBackgroundPlayer() {
    if (this.ytPlayer || typeof window === "undefined") return;

    let container = document.getElementById("bg-audio-engine-host");
    if (!container) {
      container = document.createElement("div");
      container.id = "bg-audio-engine-host";
      container.style.cssText =
        "position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:1;pointer-events:none;z-index:-1;overflow:hidden;";
      const targetDiv = document.createElement("div");
      targetDiv.id = "bg-yt-audio-target";
      container.appendChild(targetDiv);
      document.body.appendChild(container);
    }

    const setupPlayer = () => {
      if (this.ytPlayer) return;
      try {
        this.ytPlayer = new window.YT.Player("bg-yt-audio-target", {
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              this.isYTReady = true;
              if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
                this.ytPlayer.setVolume(this.state.volume * 100);
              }
              if (this.pendingYTVideoId) {
                this.playBackgroundVideo(this.pendingYTVideoId);
                this.pendingYTVideoId = null;
              }
            },
            onStateChange: (event) => {
              if (this.activeEngine !== "youtube") return;
              if (event.data === 1) { // Playing
                this.state.isPlaying = true;
                if (this.pendingSeek > 0) {
                  try { this.ytPlayer.seekTo(this.pendingSeek, true); } catch (e) {}
                  this.pendingSeek = 0;
                }
                const d = this.ytPlayer.getDuration();
                if (d && d > 0) this.state.duration = d;
                this.updateMediaSessionState("playing");
                this.notify();
              } else if (event.data === 2) { // Paused
                // iOS lock screen kills YT iframe -> auto-resume if user did NOT manually pause
                if (!this.userPaused && this.activeEngine === "youtube") {
                  setTimeout(() => {
                    if (!this.userPaused && this.activeEngine === "youtube" && this.ytPlayer) {
                      try { this.ytPlayer.playVideo(); } catch(e) {}
                    }
                  }, 500);
                  return;
                }
                this.state.isPlaying = false;
                this.updateMediaSessionState("paused");
                this.notify();
              } else if (event.data === 0) { // Ended
                this.state.isPlaying = false;
                this.notify();
                this.emitEvent("track-ended");
              }
            },
            onError: (err) => {
              console.warn("Background audio engine notice:", err);
              const failed = this.state.currentTrack;
              if (failed) this.uncacheVideoId(failed); // el vídeo guardado ya no sirve
              if (failed?.url) {
                this.playAudioElement(failed);
              } else if (failed) {
                this.fallbackOrError(failed);
              }
            },
          },
        });
      } catch (e) {
        console.warn("Failed to init YT background player:", e);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => setupPlayer();
    }

    // iOS background keep-alive: when screen unlocks, resume bgKeeper + YT player
    if (!this._visibilityHandlerAdded) {
      this._visibilityHandlerAdded = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && !this.userPaused) {
          // Screen just unlocked - ensure keep-alive is running (solo con YouTube)
          if (this.activeEngine === "youtube") {
            try {
              this.bgKeeper.play().catch(() => {});
            } catch(e) {}
          }
          // Si iOS pausó el <audio> al bloquear, reanudarlo
          if (this.activeEngine === "audio" && this.state.isPlaying && this.audioElement.paused) {
            this.audioElement.play().catch(() => {});
          }
          // Resume YT if it was playing
          if (this.activeEngine === "youtube" && this.ytPlayer && !this.state.isPlaying) {
            setTimeout(() => {
              try { this.ytPlayer.playVideo(); } catch(e) {}
            }, 300);
          }
        }
      });
    }
  }

  stopYouTubeOnly() {
    if (this.ytTicker) {
      clearInterval(this.ytTicker);
      this.ytTicker = null;
    }
    try {
      if (this.ytPlayer && typeof this.ytPlayer.stopVideo === "function") {
        this.ytPlayer.stopVideo();
      }
    } catch (e) {}
  }

  stopAllAudio() {
    this.state.isPlaying = false;
    if (this.ytTicker) {
      clearInterval(this.ytTicker);
      this.ytTicker = null;
    }

    // 1. Fully silence HTML5 audio
    try {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.removeAttribute("src");
      this.audioElement.load();
    } catch (e) {}

    // 2. Fully stop YouTube player
    try {
      if (this.ytPlayer) {
        if (typeof this.ytPlayer.stopVideo === "function") {
          this.ytPlayer.stopVideo();
        } else if (typeof this.ytPlayer.pauseVideo === "function") {
          this.ytPlayer.pauseVideo();
        }
      }
    } catch (e) {}
  }

  playBackgroundVideo(videoId) {
    // En móvil (iPhone/Android) el reproductor de YouTube se corta al bloquear la pantalla.
    // Se usa el <audio> normal con el audio que sirve tu propio servidor (/api/stream), que sí sigue sonando
    // con la pantalla apagada. Si ese stream falla, se vuelve al reproductor de YouTube como antes.
    if (
      this.isMobile &&
      this.state.currentTrack &&
      this._streamFailedFor !== videoId
    ) {
      this.playAudioElement(this.state.currentTrack, `/api/stream?id=${encodeURIComponent(videoId)}`);
      return;
    }

    this.stopAllAudio();
    this.activeEngine = "youtube";
    this.userPaused = false;
    this.isYouTube = true;
    this.bgKeeper.play().catch(() => {});

    if (!this.isYTReady || !this.ytPlayer || typeof this.ytPlayer.loadVideoById !== "function") {
      this.pendingYTVideoId = videoId;
      this.initBackgroundPlayer();
      return;
    }

    try {
      if (typeof this.ytPlayer.unMute === "function") {
        this.ytPlayer.unMute();
      }
      if (typeof this.ytPlayer.setVolume === "function") {
        this.ytPlayer.setVolume(this.state.volume * 100);
      }
      this.ytPlayer.loadVideoById(videoId);
      this.ytPlayer.playVideo();
      this.state.isPlaying = true;
      this.updateMediaSessionState("playing");
      this.startBackgroundTicker();
      this.notify();
    } catch (e) {
      console.warn("loadVideoById error:", e);
    }
  }

  startBackgroundTicker() {
    if (this.ytTicker) clearInterval(this.ytTicker);
    this.ytTicker = setInterval(() => {
      if (this.activeEngine === "youtube" && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === "function") {
        try {
          const t = this.ytPlayer.getCurrentTime() || 0;
          const d = this.ytPlayer.getDuration() || this.state.duration;
          this.state.currentTime = t;
          if (d > 0) this.state.duration = d;
          this.updateMediaSessionPosition();
          this.notify();
        } catch (e) {}
      }
    }, 250);
  }

  playAudioElement(track, streamUrl = null) {
    // No usamos stopAllAudio() aquí: quitar el src y hacer load() corta la sesión de audio en iOS
    // y con la pantalla bloqueada la siguiente canción ya no arrancaba.
    this.stopYouTubeOnly();
    this.activeEngine = "audio";
    this.userPaused = false;
    this.isYouTube = false;
    this.bgKeeper.pause();

    const finalUrl = streamUrl || track.url;
    const isMobileDevice = typeof navigator !== "undefined" && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
    );
    if (isMobileDevice) {
      // En móvil no se usa Web Audio, y crossOrigin podía bloquear previews de otros dominios
      this.audioElement.removeAttribute("crossorigin");
    } else if (finalUrl && (finalUrl.startsWith("/api/stream") || !finalUrl.startsWith("blob:"))) {
      this.audioElement.crossOrigin = "anonymous";
    }

    this.audioElement.src = finalUrl;
    this.audioElement.currentTime = 0;

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (this.activeEngine !== "audio") {
          this.audioElement.pause();
          return;
        }
        this.state.isPlaying = true;
        this.updateMediaSession(track);
        this.updateMediaSessionState("playing");
        this.notify();
      }).catch((err) => {
        console.warn("Direct play error:", err);
      });
    }
    this.state.isPlaying = true;
    this.notify();
  }

  playTrack(track, startAt = 0) {
    if (!track) return;
    this.pendingSeek = startAt > 3 ? startAt : 0;
    this._fallbackTried?.delete(track);
    this.userPaused = false;
    this.initContext();
    this.state.currentTrack = track;
    this.state.currentTime = 0;
    if (track.duration && track.duration > 0) {
      this.state.duration = track.duration;
    }
    this.updateMediaSession(track);
    statsService.recordSongStart(track);
    musicService.recordRecentlyPlayed(track);

    // 1. Direct native audio file URL (e.g. /audio/columbia.m4a, local upload, or direct stream)
    const isDirectAudio = track.url && (
      track.url.startsWith("/audio/") ||
      track.url.startsWith("blob:") ||
      track.sourceType === "local" ||
      track.url.endsWith(".m4a") ||
      track.url.endsWith(".mp3")
    );

    if (isDirectAudio) {
      this.playAudioElement(track, track.url);
      return;
    }

    // 2. Track has verified YouTube videoId -> Play directly and immediately!
    if (track.videoId) {
      this.initBackgroundPlayer();
      this.playBackgroundVideo(track.videoId);
      return;
    }

    // 3. Search track without videoId: resolve official original YouTube audio track via /api/resolve
    const query = (track.artist ? `${track.artist} ` : "") + (track.title || "");
    if (query.trim()) {
      const cachedId = this.getCachedVideoId(track);
      if (cachedId) {
        track.videoId = cachedId;
        this.initBackgroundPlayer();
        this.playBackgroundVideo(cachedId);
        return;
      }

      fetch(`/api/resolve?q=${encodeURIComponent(query.trim())}`)
        .then((res) => {
          if (!res.ok) throw new Error("resolve " + res.status);
          return res.json();
        })
        .then((data) => {
          if (this.state.currentTrack?.id !== track.id) return; // User already switched tracks
          if (data && data.videoId) {
            track.videoId = data.videoId;
            this.cacheVideoId(track, data.videoId);
            if (data.durationSecs) this.state.duration = data.durationSecs;
            this.initBackgroundPlayer();
            this.playBackgroundVideo(data.videoId);
          } else {
            this.fallbackOrError(track);
          }
        })
        .catch(() => {
          if (this.state.currentTrack?.id === track.id) this.fallbackOrError(track);
        });
      return;
    }

    this.fallbackOrError(track);
  }

  togglePlay() {
    this.initContext();

    // 1. If currently playing -> PAUSE EVERYTHING IMMEDIATELY
    if (this.state.isPlaying) {
      this.userPaused = true;
      this.state.isPlaying = false;
      this.bgKeeper.pause();

      if (this.ytTicker) {
        clearInterval(this.ytTicker);
        this.ytTicker = null;
      }

      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
        try { this.ytPlayer.pauseVideo(); } catch (e) {}
      }

      try {
        this.audioElement.pause();
      } catch (e) {}

      this.updateMediaSessionState("paused");
      this.notify();
      return;
    }

    // 2. If currently paused -> RESUME the active engine
    this.userPaused = false;
    if (this.activeEngine === "youtube") {
      this.bgKeeper.play().catch(() => {});
    }

    if (this.activeEngine === "youtube" && this.ytPlayer && typeof this.ytPlayer.playVideo === "function") {
      try {
        this.ytPlayer.playVideo();
        this.state.isPlaying = true;
        this.startBackgroundTicker();
        this.updateMediaSessionState("playing");
        this.notify();
        return;
      } catch (e) {}
    }

    if (this.activeEngine === "audio" && this.audioElement.src) {
      this.audioElement.play().then(() => {
        this.state.isPlaying = true;
        this.updateMediaSessionState("playing");
        this.notify();
      }).catch((err) => {
        console.warn("Resume audio error:", err);
      });
      return;
    }

    // 3. Fallback: If no engine is active, play current track
    if (this.state.currentTrack) {
      this.playTrack(this.state.currentTrack);
    }
  }

  seek(seconds) {
    if (this.activeEngine === "youtube" && this.ytPlayer && typeof this.ytPlayer.seekTo === "function") {
      try {
        this.ytPlayer.seekTo(seconds, true);
        this.state.currentTime = seconds;
        this.updateMediaSessionPosition();
        this.notify();
        return;
      } catch (e) {}
    }

    if (this.activeEngine === "audio") {
      this.audioElement.currentTime = seconds;
      this.state.currentTime = seconds;
      this.updateMediaSessionPosition();
      this.notify();
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.state.volume = clamped;
    this.state.isMuted = clamped === 0;
    this.audioElement.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.05);
    }
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
      try {
        this.ytPlayer.setVolume(clamped * 100);
      } catch (e) {}
    }
    this.notify();
  }

  toggleMute() {
    if (this.state.isMuted) {
      this.setVolume(this.previousVolume || 0.8);
      this.state.isMuted = false;
    } else {
      this.previousVolume = this.state.volume;
      this.setVolume(0);
      this.state.isMuted = true;
    }
    this.notify();
  }

  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(128);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  playJellyPop(frequency = 440) {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.audioCtx.currentTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.7, this.audioCtx.currentTime + 0.08);

      g.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(g);
      g.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.09);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
if (typeof window !== "undefined") {
  window.audioEngine = audioEngine;
}

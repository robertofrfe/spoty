// statsService: Tracks persistent listening time, play counts, and metrics for MMTOP Stats

const STATS_KEY = "mmtop_user_stats";

class StatsService {
  constructor() {
    this.data = this.loadStats();
    this.listeners = new Set();
  }

  loadStats() {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    // Default clean stats
    return {
      totalListeningSeconds: 0,
      totalSongsPlayed: 0,
      tracks: {}, // { [trackId]: { id, title, artist, cover, playCount, totalSeconds } }
      artists: {}, // { [artistName]: { name, playCount, image } }
      genres: {}, // { [genre]: playCount }
      dailySeconds: {}, // { "2026-10-31": seconds }
      firstListenedDate: Date.now(),
    };
  }

  save() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.data));
    } catch (e) {}
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSummary());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const summary = this.getSummary();
    for (const listener of this.listeners) {
      listener(summary);
    }
  }

  // Call when a song starts playing
  recordSongStart(track) {
    if (!track) return;
    this.data.totalSongsPlayed = (this.data.totalSongsPlayed || 0) + 1;

    // Track play counts
    if (!this.data.tracks[track.id]) {
      this.data.tracks[track.id] = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        playCount: 1,
        totalSeconds: 0,
        sourceType: track.sourceType,
        youtubeId: track.youtubeId,
        url: track.url,
      };
    } else {
      this.data.tracks[track.id].playCount += 1;
    }

    // Artist play counts
    const artist = track.artist || "Desconocido";
    if (!this.data.artists[artist]) {
      this.data.artists[artist] = {
        name: artist,
        playCount: 1,
        image: track.cover,
      };
    } else {
      this.data.artists[artist].playCount += 1;
    }

    this.save();
  }

  // Call periodically while playing (e.g. every second)
  recordListeningSecond(track, seconds = 1) {
    if (!track) return;
    this.data.totalListeningSeconds = (this.data.totalListeningSeconds || 0) + seconds;

    if (this.data.tracks[track.id]) {
      this.data.tracks[track.id].totalSeconds = (this.data.tracks[track.id].totalSeconds || 0) + seconds;
    }

    // Daily record
    const today = new Date().toISOString().split("T")[0];
    this.data.dailySeconds[today] = (this.data.dailySeconds[today] || 0) + seconds;

    // Throttle saves to every 5 seconds or save directly
    this.save();
  }

  getSummary() {
    const tracksList = Object.values(this.data.tracks || {});
    // Sort tracks by play count
    tracksList.sort((a, b) => b.playCount - a.playCount || b.totalSeconds - a.totalSeconds);

    const topTrack = tracksList.length > 0 ? tracksList[0] : null;

    // Sort artists
    const artistsList = Object.values(this.data.artists || {});
    artistsList.sort((a, b) => b.playCount - a.playCount);
    const topArtist = artistsList.length > 0 ? artistsList[0] : null;

    const totalSeconds = this.data.totalListeningSeconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Fun listening facts
    let badge = "Oyente Principiante";
    if (totalSeconds > 3600 * 5) badge = "Melómano Experto";
    else if (totalSeconds > 3600 * 2) badge = "Fanático Musical";
    else if (totalSeconds > 1800) badge = "Oyente Habitual";

    return {
      totalListeningSeconds: totalSeconds,
      hours,
      minutes,
      totalSongsPlayed: this.data.totalSongsPlayed || 0,
      topTrack,
      topTracks: tracksList.slice(0, 5),
      topArtist,
      topArtists: artistsList.slice(0, 5),
      badge,
      activeDaysCount: Object.keys(this.data.dailySeconds || {}).length || 1,
    };
  }

  resetStats() {
    this.data = {
      totalListeningSeconds: 0,
      totalSongsPlayed: 0,
      tracks: {},
      artists: {},
      genres: {},
      dailySeconds: {},
      firstListenedDate: Date.now(),
    };
    this.save();
  }
}

export const statsService = new StatsService();

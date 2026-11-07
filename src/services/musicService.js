import { IMPORTED_PLAYLIST } from "../data/importedPlaylist.js";
// musicService: MMTOP Music Service with Full Direct Audio Streams, Local IndexedDB Storage, and Playlists

const DB_NAME = "MMTOP_DB";
const STORE_NAME = "local_tracks";

// Verified popular tracks with high-quality direct audio streams (Full original studio recordings, native HTML5 background & lock screen playback)
export const POPULAR_HITS = [
  {
    id: "hit-columbia",
    title: "Columbia",
    artist: "Quevedo",
    album: "DONDE QUIERO ESTAR",
    duration: 186,
    durationStr: "3:06",
    cover: "https://i.ytimg.com/vi/Y2QUKEt2p98/hqdefault.jpg",
    videoId: "Y2QUKEt2p98",
    url: "/audio/columbia.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-ojitos",
    title: "Ojitos Lindos",
    artist: "Bad Bunny & Bomba Estéreo",
    album: "Un Verano Sin Ti",
    duration: 258,
    durationStr: "4:18",
    cover: "https://i.ytimg.com/vi/10EX-_h4pYc/hqdefault.jpg",
    videoId: "10EX-_h4pYc",
    url: "/audio/ojitos-lindos.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-yellow",
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    duration: 269,
    durationStr: "4:29",
    cover: "https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg",
    videoId: "yKNxeF4KMsY",
    url: "/audio/yellow.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-blinding",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: 200,
    durationStr: "3:20",
    cover: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    videoId: "4NRXx6U8ABQ",
    url: "/audio/blinding-lights.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-despecha",
    title: "DESPECHÁ",
    artist: "ROSALÍA",
    album: "MOTOMAMI +",
    duration: 157,
    durationStr: "2:37",
    cover: "https://i.ytimg.com/vi/Y2ESxHKuSOk/hqdefault.jpg",
    videoId: "Y2ESxHKuSOk",
    url: "/audio/despecha.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-bzrp52",
    title: "Quevedo: Bzrp Music Sessions, Vol. 52",
    artist: "Bizarrap & Quevedo",
    album: "Single",
    duration: 198,
    durationStr: "3:18",
    cover: "https://i.ytimg.com/vi/A_g3lMcWVy0/hqdefault.jpg",
    videoId: "A_g3lMcWVy0",
    url: "/audio/bzrp-52.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-luna",
    title: "LUNA",
    artist: "Feid & ATL Jacob",
    album: "FERXXOCALIPSIS",
    duration: 196,
    durationStr: "3:16",
    cover: "https://i.ytimg.com/vi/e_04ZrNroTo/hqdefault.jpg",
    videoId: "e_04ZrNroTo",
    url: "/audio/feid-luna.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-memorias",
    title: "MEMORIAS",
    artist: "Mora & Jhayco",
    album: "MICRODOSIS",
    duration: 235,
    durationStr: "3:55",
    cover: "https://i.ytimg.com/vi/hoWI-y21ttw/hqdefault.jpg",
    videoId: "hoWI-y21ttw",
    url: "/audio/mora-memorias.m4a",
    sourceType: "stream"
  },
  {
    id: "hit-levitating",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: 203,
    durationStr: "3:23",
    cover: "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg",
    videoId: "TUVcZfQe-Kw",
    url: "/audio/dua-lipa-levitating.m4a",
    sourceType: "stream"
  }
];

export const POPULAR_PLAYLISTS = [
  IMPORTED_PLAYLIST,
  {
    id: "pl-top-spain",
    name: "Top 50: España",
    description: "Los temas más escuchados en España actualizados diariamente.",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    tracks: POPULAR_HITS
  },
  {
    id: "pl-viva-latino",
    name: "Viva Latino",
    description: "Los mayores éxitos de la música urbana y reggaetón.",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    tracks: [POPULAR_HITS[0], POPULAR_HITS[1], POPULAR_HITS[4], POPULAR_HITS[5], POPULAR_HITS[6], POPULAR_HITS[7]]
  },
  {
    id: "pl-pop-up",
    name: "Éxitos Globales",
    description: "Lo que suena en todo el mundo sin cortes publicitarios.",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    tracks: [POPULAR_HITS[2], POPULAR_HITS[3], POPULAR_HITS[8]]
  }
];

export const POPULAR_ARTISTS = [
  { id: 10583405, name: "Bad Bunny", genre: "Urbano Latino", image: "https://cdn-images.dzcdn.net/images/artist/044a3f315b041864887a8dd8709e6926/500x500-000000-80-0-0.jpg" },
  { id: 6705223, name: "Quevedo", genre: "Reggaetón", image: "https://cdn-images.dzcdn.net/images/artist/ee02749274070488eb9362d55826db08/500x500-000000-80-0-0.jpg" },
  { id: 554792, name: "Rosalía", genre: "Pop", image: "https://cdn-images.dzcdn.net/images/artist/33e9b1d1f059cb5caae12b5bdf4d412e/500x500-000000-80-0-0.jpg" },
  { id: 892, name: "Coldplay", genre: "Rock", image: "https://cdn-images.dzcdn.net/images/artist/3087954bca22f306324912e5ac8375c3/500x500-000000-80-0-0.jpg" },
  { id: 4050205, name: "The Weeknd", genre: "R&B / Pop", image: "https://cdn-images.dzcdn.net/images/artist/7f8a7057fc8d31ec7a8ba324b1ff3c43/500x500-000000-80-0-0.jpg" },
  { id: 1166311, name: "Feid", genre: "Urbano Latino", image: "https://cdn-images.dzcdn.net/images/artist/e629c93e03b3c225d8d52a42bae71537/500x500-000000-80-0-0.jpg" },
  { id: 3922661, name: "Mora", genre: "Trap / Urbano", image: "https://cdn-images.dzcdn.net/images/artist/f44bb8e98463bc41d195c63c43768701/500x500-000000-80-0-0.jpg" },
  { id: 8706544, name: "Dua Lipa", genre: "Pop", image: "https://cdn-images.dzcdn.net/images/artist/35824c16f0bbecb8dcfce20216b2512a/500x500-000000-80-0-0.jpg" }
];

export const GENRES = [
  {
    id: "g-pop",
    name: "Pop",
    color: "#8d67ab",
    query: "pop hits",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80"
  },
  {
    id: "g-urbano",
    name: "Urbano Latino",
    color: "#e8115b",
    query: "reggaeton latino",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80"
  },
  {
    id: "g-hiphop",
    name: "Hip-Hop & Trap",
    color: "#bc5900",
    query: "trap en español",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80"
  },
  {
    id: "g-rock",
    name: "Rock",
    color: "#e91429",
    query: "rock clasico",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80"
  },
  {
    id: "g-indie",
    name: "Indie",
    color: "#608108",
    query: "indie español",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80"
  },
  {
    id: "g-dance",
    name: "Electrónica",
    color: "#0d73ec",
    query: "electronic dance",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80"
  },
  {
    id: "g-lofi",
    name: "Chill & Relax",
    color: "#b02897",
    query: "chill out relax",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80"
  },
  {
    id: "g-8d",
    name: "Música 8D",
    color: "#148a08",
    query: "8d audio canciones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
  },
  {
    id: "g-ponk",
    name: "Ponk",
    color: "#1e3264",
    query: "verity phonk",
    image: "/covers/verity-phonk.jpg"
  },
  {
    id: "g-triste",
    name: "Música Triste",
    color: "#381824",
    query: "musica triste",
    image: "/covers/cover-666.svg"
  }
];

class MusicService {
  constructor() {
    this.db = null;
    this.initIndexedDB();

    // STRICT REQUIREMENT: No pre-filled songs in favorites by default!
    this.likedTrackMap = JSON.parse(localStorage.getItem("mmtop_liked_tracks") || "{}");
    this.likedTrackIds = new Set(Object.keys(this.likedTrackMap));

    // Persistent playlists (Saved in localStorage)
    const storedPlaylists = localStorage.getItem("mmtop_playlists");
    if (storedPlaylists) {
      try {
        this.playlists = JSON.parse(storedPlaylists);
      } catch (e) {
        this.playlists = [];
      }
    } else {
      this.playlists = [];
      this.savePlaylists();
    }
  }

  savePlaylists() {
    localStorage.setItem("mmtop_playlists", JSON.stringify(this.playlists));
  }

  saveLikes() {
    localStorage.setItem("mmtop_liked_tracks", JSON.stringify(this.likedTrackMap));
  }

  // ============================
  // RECENTLY PLAYED TRACKS (Escuchado Recientemente)
  // ============================
  recordRecentlyPlayed(track) {
    if (!track) return;
    try {
      const stored = JSON.parse(localStorage.getItem("mmtop_recently_played") || "[]");
      const filtered = stored.filter((t) => t.id !== track.id);
      const cleanTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artistId: track.artistId || null,
        album: track.album || null,
        albumId: track.albumId || null,
        duration: track.duration || 180,
        durationStr: track.durationStr || "3:00",
        cover: track.cover,
        url: track.url || null,
        videoId: track.videoId || null,
        sourceType: track.sourceType || "stream",
        playedAt: Date.now()
      };
      const updated = [cleanTrack, ...filtered].slice(0, 30);
      localStorage.setItem("mmtop_recently_played", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("mmtop:recently-played-updated", { detail: updated }));
    } catch (e) {}
  }

  getRecentlyPlayed() {
    try {
      return JSON.parse(localStorage.getItem("mmtop_recently_played") || "[]");
    } catch (e) {
      return [];
    }
  }

  // ============================
  // ARTIST PROFILE (Spotify-Style Artist Views)
  // ============================
  async getArtistProfile(param) {
    if (!param) return null;
    try {
      const isId = typeof param === "number" || (!isNaN(param) && !isNaN(parseFloat(param)));
      const url = isId ? `/api/artist?id=${encodeURIComponent(param)}` : `/api/artist?name=${encodeURIComponent(param)}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("getArtistProfile error:", err);
    }
    return null;
  }

  isArtistFollowed(artistId) {
    try {
      const followed = JSON.parse(localStorage.getItem("mmtop_followed_artists") || "[]");
      return followed.includes(String(artistId));
    } catch (e) {
      return false;
    }
  }

  toggleFollowArtist(artistId) {
    try {
      let followed = JSON.parse(localStorage.getItem("mmtop_followed_artists") || "[]");
      const strId = String(artistId);
      if (followed.includes(strId)) {
        followed = followed.filter((id) => id !== strId);
      } else {
        followed.push(strId);
      }
      localStorage.setItem("mmtop_followed_artists", JSON.stringify(followed));
      return followed.includes(strId);
    } catch (e) {
      return false;
    }
  }

  // ============================
  // FULL DIRECT AUDIO STREAM SEARCH (Local API + Audius + iTunes Fallback)
  // ============================
  async searchMusic(query) {
    if (!query || query.trim().length === 0) return { songs: [], artists: [], topResult: null };

    const cleanQuery = query.trim();

    // 1. Fast local backend search (/api/search)
    try {
      const serverRes = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
      if (serverRes.ok) {
        const json = await serverRes.json();
        return {
          songs: json.songs || [],
          artists: json.artists || [],
          topResult: json.topResult || (json.songs && json.songs[0]) || null
        };
      }
    } catch (err) {
      console.warn("Local search API notice, falling back:", err);
    }

    // 2. Direct Fallback to Apple Music / iTunes Catalog with Full Audio Stream
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=25`;
      const res = await fetch(itunesUrl);
      const data = await res.json();
      const songs = (data.results || []).map((r) => {
        const durSecs = Math.round(r.trackTimeMillis / 1000) || 180;
        return {
          id: "itunes-" + r.trackId,
          title: r.trackName,
          artist: r.artistName,
          album: r.collectionName,
          duration: durSecs,
          durationStr: this.formatSeconds(durSecs),
          cover: r.artworkUrl100 ? r.artworkUrl100.replace("100x100bb", "600x600bb") : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
          fallbackPreview: r.previewUrl,
          sourceType: "stream"
        };
      });

      return {
        songs,
        topResult: songs[0] || null,
        artists: []
      };
    } catch (e) {
      return { songs: [], artists: [], topResult: null };
    }
  }

  formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  // ============================
  // FAVORITES (Saved per track)
  // ============================
  toggleLike(track) {
    if (!track) return false;
    const trackId = track.id;

    if (this.likedTrackIds.has(trackId)) {
      this.likedTrackIds.delete(trackId);
      delete this.likedTrackMap[trackId];
    } else {
      this.likedTrackIds.add(trackId);
      this.likedTrackMap[trackId] = track;
    }

    this.saveLikes();
    return this.likedTrackIds.has(trackId);
  }

  isLiked(trackId) {
    return this.likedTrackIds.has(trackId);
  }

  getLikedTracks() {
    return Object.values(this.likedTrackMap);
  }

  // ============================
  // PLAYLISTS MANAGEMENT
  // ============================
  getPlaylists() {
    const idx = this.playlists.findIndex((p) => p.id === IMPORTED_PLAYLIST.id);
    if (idx >= 0) {
      this.playlists[idx] = IMPORTED_PLAYLIST;
    } else {
      this.playlists.unshift(IMPORTED_PLAYLIST);
    }
    return this.playlists;
  }

  createPlaylist(name, description = "Playlist privada en MMTOP", color = "#1ed760", emoji = "🎵") {
    const newPl = {
      id: "pl-" + Date.now(),
      name: name || "Mi Playlist",
      description,
      color,
      emoji,
      tracks: [],
      createdAt: Date.now()
    };
    this.playlists.push(newPl);
    this.savePlaylists();
    return newPl;
  }

  addTrackToPlaylist(playlistId, track) {
    const pl = this.playlists.find((p) => p.id === playlistId);
    if (pl) {
      if (!pl.tracks) pl.tracks = [];
      const alreadyExists = pl.tracks.some((t) => t.id === track.id);
      if (!alreadyExists) {
        pl.tracks.push(track);
        this.savePlaylists();
        return true;
      }
    }
    return false;
  }

  removeTrackFromPlaylist(playlistId, trackId) {
    const pl = this.playlists.find((p) => p.id === playlistId);
    if (pl && pl.tracks) {
      pl.tracks = pl.tracks.filter((t) => t.id !== trackId);
      this.savePlaylists();
      return true;
    }
    return false;
  }

  deletePlaylist(playlistId) {
    this.playlists = this.playlists.filter((p) => p.id !== playlistId);
    this.savePlaylists();
    return this.playlists;
  }

  // ============================
  // INDEXEDDB LOCAL MP3 STORAGE
  // ============================
  initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      request.onerror = () => resolve(null);
    });
  }

  async saveLocalTrack(file) {
    if (!this.db) await this.initIndexedDB();
    const id = "local-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const trackData = {
      id,
      title: cleanName,
      artist: "Archivo Local",
      album: "Tu Música en MMTOP",
      duration: 180,
      durationStr: "3:00",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
      blob: file,
      sourceType: "local",
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(trackData);
        tx.oncomplete = () => {
          trackData.url = URL.createObjectURL(file);
          resolve(trackData);
        };
        tx.onerror = (e) => reject(e);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getLocalTracks() {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const tracks = (req.result || []).map((t) => ({
            ...t,
            url: URL.createObjectURL(t.blob)
          }));
          resolve(tracks);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async deleteLocalTrack(id) {
    if (!this.db) await this.initIndexedDB();
    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_NAME], "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
    });
  }
}

export const musicService = new MusicService();

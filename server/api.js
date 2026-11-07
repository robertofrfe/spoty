// server/api.js: Fast Music Search & Audio Stream Proxy (Deezer Studio Catalog + YouTube Official Audio Streams + Apple Music)
import { Readable } from 'stream';
import { Ytdl, Client } from '@distube/ytdl-core';

let ytdlClient = null;
function getYtdl() {
  if (!ytdlClient) {
    ytdlClient = new Ytdl({
      clients: [Client.Android, Client.Ios, Client.Web, Client.Tv]
    });
  }
  return ytdlClient;
}

const resolveCache = new Map();
const ytSearchCache = new Map();
const formatInfoCache = new Map();

// ---- Seguridad básica ----
// Límite de peticiones por IP y minuto (en memoria; en Vercel se reinicia con cada instancia, pero frena abusos simples)
const rateHits = new Map();
function isRateLimited(req, bucket, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const key = bucket + ':' + ip;
  const now = Date.now();
  const recent = (rateHits.get(key) || []).filter((t) => now - t < 60000);
  recent.push(now);
  rateHits.set(key, recent);
  if (rateHits.size > 5000) {
    for (const [k, v] of rateHits) {
      if (!v.length || now - v[v.length - 1] > 60000) rateHits.delete(k);
    }
  }
  return recent.length > max;
}

// El proxy /api/stream?url= antes aceptaba CUALQUIER url (proxy abierto / SSRF). Ahora solo hosts de previews musicales.
const ALLOWED_PROXY_HOSTS = ['scdn.co', 'dzcdn.net', 'mzstatic.com', 'apple.com'];
function isAllowedProxyUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_PROXY_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch (e) {
    return false;
  }
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatFans(num) {
  if (!num) return '0';
  return new Intl.NumberFormat('es-ES').format(num);
}

function formatDeezerTrack(t) {
  const durSecs = t.duration || 180;
  const artistName = t.artist?.name || 'Artista';
  const songTitle = t.title || 'Canción';
  return {
    id: 'dz-' + t.id,
    title: songTitle,
    artist: artistName,
    artistId: t.artist?.id || null,
    artistImage: t.artist?.picture_big || t.artist?.picture_medium,
    album: t.album?.title || 'Sencillo',
    albumId: t.album?.id || null,
    duration: durSecs,
    durationStr: formatSeconds(durSecs),
    cover: t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    fallbackPreview: t.preview,
    sourceType: 'stream'
  };
}

const badWords = ['remix', 'edit', 'mashup', 'cover', 'tutorial', 'karaoke', 'tributo', 'parodia', 'slowed', 'reverb', 'bass boosted', '8d', 'instrumental', 'acapella', 'tiktok', 'sped up', 'speed up'];
function isCleanOriginal(title, query) {
  const userWantsRemix = /\b(remix|edit|mashup|cover|karaoke|instrumental)\b/i.test(query || '');
  if (userWantsRemix) return true;
  const lower = (title || '').toLowerCase();
  return !badWords.some((w) => lower.includes(w));
}

async function searchYouTubeVideo(cleanQ) {
  const cacheKey = cleanQ.toLowerCase();
  if (ytSearchCache.has(cacheKey)) {
    return ytSearchCache.get(cacheKey);
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQ + ' audio oficial')}`;
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    const html = await ytRes.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
      
      let candidate = null;
      let fallbackCandidate = null;

      for (const c of contents) {
        const v = c.videoRenderer;
        if (v && v.videoId) {
          const timeParts = (v.lengthText?.simpleText || '0:0').split(':').map(Number);
          const durSecs = timeParts.length === 2 ? timeParts[0] * 60 + timeParts[1] : timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          if (durSecs > 50 && durSecs < 1200) {
            const videoTitle = v.title?.runs?.[0]?.text || '';
            const item = {
              videoId: v.videoId,
              title: videoTitle,
              durationSecs: durSecs,
              durationStr: formatSeconds(durSecs)
            };

            if (!fallbackCandidate) {
              fallbackCandidate = item;
            }

            if (isCleanOriginal(videoTitle, cleanQ)) {
              candidate = item;
              break;
            }
          }
        }
      }

      const selected = candidate || fallbackCandidate;
      if (selected) {
        ytSearchCache.set(cacheKey, selected);
        return selected;
      }
    }
  } catch (err) {
    console.warn('searchYouTubeVideo error:', err.message);
  }
  return null;
}

async function streamYouTubeAudio(videoId, req, res) {
  try {
    const client = getYtdl();
    let format = formatInfoCache.get(videoId);
    if (!format) {
      const info = await client.getInfo('https://www.youtube.com/watch?v=' + videoId);
      const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
      format = audioFormats.find((f) => f.container === 'mp4') || audioFormats[0];
      if (format) formatInfoCache.set(videoId, format);
    }

    if (!format) {
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Audio format not found');
      return;
    }

    const totalLength = parseInt(format.contentLength, 10) || 0;
    let start = 0;
    let end = totalLength > 0 ? totalLength - 1 : undefined;
    let isRange = false;

    const rangeHeader = req.headers['range'];
    if (rangeHeader) {
      isRange = true;
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10) || 0;
      if (parts[1]) {
        end = parseInt(parts[1], 10);
      }
    }

    // Limit chunk size to 1.5MB to ensure snappy responses and prevent serverless timeouts
    const MAX_CHUNK = 1.5 * 1024 * 1024;
    if (totalLength > 0) {
      if (end === undefined || (end - start + 1) > MAX_CHUNK) {
        end = Math.min(start + MAX_CHUNK - 1, totalLength - 1);
      }
    }

    const downloadOpts = {
      filter: { hasAudio: true, hasVideo: false, container: 'mp4' }
    };
    if (start > 0 || (end !== undefined && totalLength > 0 && end < totalLength - 1)) {
      downloadOpts.range = { start, end };
    }

    const stream = await client.download('https://www.youtube.com/watch?v=' + videoId, downloadOpts);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/mp4'
    };

    if (req.method === 'HEAD') {
      if (totalLength > 0) headers['Content-Length'] = totalLength;
      res.writeHead(200, headers);
      res.end();
      return;
    }

    if (isRange && totalLength > 0) {
      headers['Content-Range'] = `bytes ${start}-${end}/${totalLength}`;
      headers['Content-Length'] = end - start + 1;
      res.writeHead(206, headers);
    } else {
      if (totalLength > 0 && end !== undefined) {
        headers['Content-Length'] = end - start + 1;
      }
      res.writeHead(200, headers);
    }

    stream.pipe(res);
    req.on('close', () => {
      try { stream.destroy(); } catch (e) {}
    });
  } catch (err) {
    console.error('streamYouTubeAudio error for ' + videoId + ':', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    }
    res.end('Error streaming audio: ' + err.message);
  }
}

export async function handleBackendRequest(req, res, next = () => {}) {
  // CORS: solo se permite el propio origen de la app (antes era '*', es decir, cualquier web)
  const origin = req.headers.origin;
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && new URL(origin).host === req.headers.host;
  } catch (e) {}
  const origWriteHead = res.writeHead.bind(res);
  res.writeHead = (status, headers) => {
    if (headers && typeof headers === 'object') {
      if (sameOrigin) headers['Access-Control-Allow-Origin'] = origin;
      else delete headers['Access-Control-Allow-Origin'];
    }
    return origWriteHead(status, headers);
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  const RATE_LIMITS = { '/api/stream': 600, '/api/resolve': 90, '/api/search': 60, '/api/artist': 60 };
  if (RATE_LIMITS[pathname] && isRateLimited(req, pathname, RATE_LIMITS[pathname])) {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '30' });
    res.end(JSON.stringify({ error: 'Too many requests' }));
    return;
  }

    // High-Performance Audio Stream Proxy (CORS-friendly for HTML5 Audio & Web Audio API 8D)
    if (pathname === '/api/stream') {
      let targetUrl = parsedUrl.searchParams.get('url');
      const videoId = parsedUrl.searchParams.get('id');
      const query = parsedUrl.searchParams.get('q');
      const artist = parsedUrl.searchParams.get('artist');
      const title = parsedUrl.searchParams.get('title');

      // 1. Direct YouTube video stream by videoId (Official Studio Version)
      if (videoId) {
        return streamYouTubeAudio(videoId, req, res);
      }

      // 2. Search YouTube for official studio audio by query or artist + title
      const searchQuery = (query || (artist && title ? `${artist} ${title}` : null) || title || '').trim();
      if (searchQuery) {
        const ytInfo = await searchYouTubeVideo(searchQuery);
        if (ytInfo && ytInfo.videoId) {
          return streamYouTubeAudio(ytInfo.videoId, req, res);
        }
      }

      // 3. Proxy external direct stream URL (if provided)
      if (targetUrl && isAllowedProxyUrl(targetUrl)) {
        try {
          const upstreamHeaders = {};
          if (req.headers['range']) {
            upstreamHeaders['range'] = req.headers['range'];
          }

          const upstreamRes = await fetch(targetUrl, {
            headers: upstreamHeaders,
            redirect: 'follow'
          });

          const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
            'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
            'Accept-Ranges': 'bytes',
            'Content-Type': upstreamRes.headers.get('content-type') || 'audio/mp4'
          };

          if (upstreamRes.headers.has('content-length')) {
            responseHeaders['Content-Length'] = upstreamRes.headers.get('content-length');
          }
          if (upstreamRes.headers.has('content-range')) {
            responseHeaders['Content-Range'] = upstreamRes.headers.get('content-range');
          }

          res.writeHead(upstreamRes.status, responseHeaders);

          if (req.method === 'HEAD' || !upstreamRes.body) {
            res.end();
            return;
          }

          const nodeStream = Readable.fromWeb(upstreamRes.body);
          nodeStream.pipe(res);

          req.on('close', () => {
            try {
              nodeStream.destroy();
            } catch (e) {}
          });
          return;
        } catch (err) {
          console.error('Audio stream proxy error:', err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
          }
          res.end('Error streaming audio');
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Missing or unresolvable audio stream');
      return;
    }

    // Resolve Full-Length Audio Endpoint (Direct Audio Stream URLs)
    if (pathname === '/api/resolve') {
      const query = parsedUrl.searchParams.get('q');
      if (!query || !query.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Missing query' }));
        return;
      }

      const cleanQ = query.trim();
      const cacheKey = cleanQ.toLowerCase();

      if (resolveCache.has(cacheKey)) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(resolveCache.get(cacheKey)));
        return;
      }

      // YouTube Official Full-Length Audio Stream
      try {
        const yt = await searchYouTubeVideo(cleanQ);
        if (yt && yt.videoId) {
          const result = {
            audioUrl: `/api/stream?id=${encodeURIComponent(yt.videoId)}`,
            videoId: yt.videoId,
            title: yt.title,
            durationSecs: yt.durationSecs,
            durationStr: yt.durationStr,
            sourceType: 'stream'
          };
          resolveCache.set(cacheKey, result);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify(result));
          return;
        }
      } catch (err) {
        console.warn('YouTube resolve error:', err.message);
      }

      res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Audio not found' }));
      return;
    }

    // Artist Profile Endpoint (Spotify-like profile: Banner, Bio, Top Tracks, Albums, Related Artists)
    if (pathname === '/api/artist') {
      const artistIdParam = parsedUrl.searchParams.get('id');
      const artistNameParam = parsedUrl.searchParams.get('name');

      if (!artistIdParam && !artistNameParam) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Missing artist id or name' }));
        return;
      }

      try {
        let finalArtistId = artistIdParam;

        // If queried by name, search and find the top matched artist
        if (!finalArtistId && artistNameParam) {
          const searchRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistNameParam.trim())}`);
          const searchData = await searchRes.json();
          const items = searchData.data || [];
          if (items.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Artist not found' }));
            return;
          }
          // Exact name match with highest fan count, or overall highest fan count
          const exactMatches = items.filter((a) => a.name.toLowerCase() === artistNameParam.trim().toLowerCase());
          let best;
          if (exactMatches.length > 0) {
            best = exactMatches.sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0))[0];
          } else {
            best = items.sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0))[0];
          }
          finalArtistId = best.id;
        }

        // Fetch artist details, top tracks, albums, and related artists in parallel
        const [artistRes, topRes, albumsRes, relatedRes] = await Promise.all([
          fetch(`https://api.deezer.com/artist/${finalArtistId}`).then((r) => r.json()),
          fetch(`https://api.deezer.com/artist/${finalArtistId}/top?limit=25`).then((r) => r.json()),
          fetch(`https://api.deezer.com/artist/${finalArtistId}/albums?limit=18`).then((r) => r.json()),
          fetch(`https://api.deezer.com/artist/${finalArtistId}/related?limit=12`).then((r) => r.json()),
        ]);

        if (artistRes.error) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Artist not found' }));
          return;
        }

        const topTracks = (topRes.data || []).map((t) => formatDeezerTrack(t));

        if (topTracks.length > 0) {
          const toResolve = topTracks.slice(0, 6);
          await Promise.all(toResolve.map(async (song) => {
            try {
              const yt = await searchYouTubeVideo(`${song.artist} ${song.title}`);
              if (yt && yt.videoId) {
                song.videoId = yt.videoId;
                if (yt.durationSecs) song.duration = yt.durationSecs;
                if (yt.durationStr) song.durationStr = yt.durationStr;
              }
            } catch (e) {}
          }));
        }

        const albums = (albumsRes.data || []).map((alb) => ({
          id: alb.id,
          title: alb.title,
          cover: alb.cover_xl || alb.cover_big || alb.cover_medium,
          releaseDate: alb.release_date ? alb.release_date.split('-')[0] : 'Álbum',
          recordType: alb.record_type || 'album',
          fans: alb.fans || 0
        }));

        const relatedArtists = (relatedRes.data || []).map((rel) => ({
          id: rel.id,
          name: rel.name,
          fans: rel.nb_fan || 0,
          fansFormatted: formatFans(rel.nb_fan || 0),
          picture: rel.picture_xl || rel.picture_big || rel.picture_medium
        }));

        const profile = {
          id: artistRes.id,
          name: artistRes.name,
          picture: artistRes.picture_xl || artistRes.picture_big || artistRes.picture_medium,
          headerPicture: artistRes.picture_xl || artistRes.picture_big,
          fans: artistRes.nb_fan || 0,
          fansFormatted: formatFans(artistRes.nb_fan || 0),
          nbAlbum: artistRes.nb_album || albums.length,
          verified: true,
          topTracks,
          albums,
          relatedArtists
        };

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(profile));
        return;
      } catch (err) {
        console.error('Artist API fetch error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Failed to fetch artist profile' }));
        return;
      }
    }

    // Direct Music & Artist Search Endpoint (Official Studio Releases)
    if (pathname === '/api/search') {
      const query = parsedUrl.searchParams.get('q');
      if (!query || !query.trim()) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ songs: [], artists: [], topResult: null }));
        return;
      }

      const cleanQ = query.trim();

      try {
        // Query official Deezer studio tracks and artists in parallel
        const [tracksRes, artistsRes] = await Promise.all([
          fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQ)}&limit=30`).then((r) => r.json()),
          fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanQ)}&limit=10`).then((r) => r.json())
        ]);

        const rawTracks = tracksRes.data || [];
        const rawArtists = (artistsRes.data || []).sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));

        const songs = rawTracks.map((t) => formatDeezerTrack(t));

        if (songs.length > 0) {
          const toResolve = songs.slice(0, 6);
          await Promise.all(toResolve.map(async (song) => {
            try {
              const yt = await searchYouTubeVideo(`${song.artist} ${song.title}`);
              if (yt && yt.videoId) {
                song.videoId = yt.videoId;
                if (yt.durationSecs) song.duration = yt.durationSecs;
                if (yt.durationStr) song.durationStr = yt.durationStr;
              }
            } catch (e) {}
          }));
        }

        const artists = rawArtists.map((a) => ({
          id: a.id,
          name: a.name,
          fans: a.nb_fan || 0,
          fansFormatted: formatFans(a.nb_fan || 0),
          picture: a.picture_xl || a.picture_big || a.picture_medium,
          albumsCount: a.nb_album || 0
        }));

        // Determine topResult: If the query matches the top artist closely, prioritize artist card
        let topResult = null;
        if (artists.length > 0 && cleanQ.length >= 2) {
          const firstArtistName = artists[0].name.toLowerCase();
          const qLower = cleanQ.toLowerCase();
          if (firstArtistName === qLower || firstArtistName.includes(qLower) || qLower.includes(firstArtistName)) {
            topResult = {
              type: 'artist',
              ...artists[0]
            };
          }
        }

        if (!topResult && songs.length > 0) {
          topResult = {
            type: 'song',
            ...songs[0]
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ songs, artists, topResult }));
        return;
      } catch (err) {
        console.warn('Deezer search error, falling back to Audius/iTunes:', err.message);
      }

      // Fallback: iTunes (Apple Music) official catalog
      try {
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&entity=song&limit=25`);
        if (itunesRes.ok) {
          const json = await itunesRes.json();
          const raw = json.results || [];
          if (raw.length > 0) {
            const songs = raw.map((r) => {
              const durSecs = Math.round(r.trackTimeMillis / 1000) || 180;
              return {
                id: 'itunes-' + r.trackId,
                title: r.trackName,
                artist: r.artistName,
                album: r.collectionName,
                duration: durSecs,
                durationStr: formatSeconds(durSecs),
                cover: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
                url: `/api/stream?q=${encodeURIComponent(r.artistName + ' ' + r.trackName)}`,
                sourceType: 'stream'
              };
            });

            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ songs, artists: [], topResult: songs[0] }));
            return;
          }
        }
      } catch (e) {}

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ songs: [], artists: [], topResult: null }));
      return;
    }

    if (typeof next === 'function') next();
}

export function configureBackendAPI(server) {
  server.middlewares.use(handleBackendRequest);
}

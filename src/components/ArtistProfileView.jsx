import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Heart,
  Plus,
  ListPlus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Users,
  Disc3,
  Shuffle
} from "lucide-react";
import { musicService } from "../services/musicService";
import { audioEngine } from "../services/audioEngine";

export default function ArtistProfileView({
  artistId,
  artistName,
  onBack,
  onPlayTrack,
  onPlayQueue,
  onAddToQueue,
  currentTrack,
  isPlaying,
  onToggleLike,
  isLiked,
  onOpenAddToPlaylist,
  onSelectArtist,
}) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function load() {
      const data = await musicService.getArtistProfile(artistId || artistName);
      if (isMounted) {
        setProfile(data);
        if (data?.id) {
          setIsFollowing(musicService.isArtistFollowed(data.id));
        }
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [artistId, artistName]);

  const handleToggleFollow = () => {
    if (!profile?.id) return;
    const newState = musicService.toggleFollowArtist(profile.id);
    setIsFollowing(newState);
    audioEngine.playJellyPop(newState ? 520 : 380);
  };

  const isCurrentArtistPlaying =
    isPlaying &&
    currentTrack &&
    profile &&
    (currentTrack.artistId === profile.id ||
      currentTrack.artist?.toLowerCase() === profile.name?.toLowerCase());

  const handlePlayTopTracks = (startIndex = 0) => {
    if (!profile?.topTracks || profile.topTracks.length === 0) return;
    if (onPlayQueue) {
      onPlayQueue(profile.topTracks, startIndex);
    } else {
      onPlayTrack?.(profile.topTracks[startIndex]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#b3b3b3] bg-[#121212]">
        <div className="w-12 h-12 rounded-full border-4 border-[#282828] border-t-[var(--accent-color)] animate-spin mb-4" />
        <span className="text-base font-medium text-white">Cargando perfil oficial de artista...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#b3b3b3] bg-[#121212]">
        <h2 className="text-2xl font-bold text-white mb-2">Artista no encontrado</h2>
        <p className="text-sm mb-6">No pudimos obtener la información del artista solicitado.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform"
        >
          Volver
        </button>
      </div>
    );
  }

  const displayedTracks = showAllTracks
    ? profile.topTracks
    : (profile.topTracks || []).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-32 select-none bg-[#121212] relative">
      {/* Spotify Artist Banner */}
      <div className="relative w-full h-72 sm:h-96 flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
        {/* Background Artist Image with Gradient Layers */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-105"
          style={{ backgroundImage: `url(${profile.headerPicture || profile.picture})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
        </div>

        {/* Top Floating Back Button */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer backdrop-blur-md"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Artist Header Information */}
        <div className="relative z-10 flex flex-col gap-2 max-w-4xl">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white drop-shadow">
            <CheckCircle2 className="w-5 h-5 fill-[#3d91f4] text-white" />
            <span>Artista verificado</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-md">
            {profile.name}
          </h1>

          <p className="text-sm sm:text-base font-semibold text-white/90 drop-shadow">
            {profile.fansFormatted} oyentes mensuales
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 flex flex-col gap-10">
        {/* Action Controls Bar */}
        <div className="flex items-center gap-6">
          {/* Big Spotify Play Button */}
          <button
            onClick={() => handlePlayTopTracks(0)}
            style={{ backgroundColor: "var(--accent-color)" }}
            className="w-14 h-14 rounded-full text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-xl"
            title="Reproducir temas populares"
          >
            {isCurrentArtistPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black ml-1" />
            )}
          </button>

          {/* Follow Button */}
          <button
            onClick={handleToggleFollow}
            className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              isFollowing
                ? "bg-transparent text-white border border-[#727272] hover:border-white"
                : "bg-transparent text-white border border-white hover:scale-105"
            }`}
          >
            {isFollowing ? "Siguiendo" : "Seguir"}
          </button>

          {/* Shuffle Play Top Tracks */}
          <button
            onClick={() => {
              if (profile.topTracks?.length > 0) {
                const shuffled = [...profile.topTracks].sort(() => Math.random() - 0.5);
                onPlayQueue?.(shuffled, 0);
              }
            }}
            title="Reproducción aleatoria"
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            <Shuffle className="w-6 h-6" />
          </button>
        </div>

        {/* Section: Populares (Top Canciones) */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Populares</h2>

          <div className="flex flex-col">
            {displayedTracks.map((track, idx) => {
              const isThisPlaying = isPlaying && currentTrack?.id === track.id;
              const liked = isLiked?.(track.id);

              return (
                <div
                  key={track.id || idx}
                  onClick={() => handlePlayTopTracks(idx)}
                  className="spotify-track-row grid grid-cols-12 items-center px-4 py-2.5 rounded-md text-sm text-[#b3b3b3] cursor-pointer group"
                >
                  {/* Number / Play Button */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className={`w-4 text-center font-mono ${
                        isThisPlaying ? "text-[var(--accent-color)] font-bold" : "group-hover:hidden"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <button className="hidden group-hover:block text-white">
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Thumbnail, Title & Single tag */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 truncate pr-2">
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0 shadow"
                    />
                    <div className="flex flex-col truncate">
                      <span
                        className={`font-semibold text-sm truncate ${
                          isThisPlaying ? "text-[var(--accent-color)]" : "text-white"
                        }`}
                      >
                        {track.title}
                      </span>
                      <span className="text-xs text-[#b3b3b3] truncate">
                        {track.album || "Sencillo oficial"}
                      </span>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="hidden sm:block sm:col-span-4 truncate text-xs text-[#b3b3b3]">
                    {track.album || "Sencillo"}
                  </div>

                  {/* Actions & Duration */}
                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-3 pr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue?.(track);
                      }}
                      title="Añadir a la cola"
                      className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist?.(track);
                      }}
                      title="Añadir a playlist"
                      className="p-1 text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike?.(track);
                      }}
                      className="p-1 text-[#b3b3b3] hover:text-white"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          liked ? "fill-[var(--accent-color)] text-[var(--accent-color)]" : ""
                        }`}
                      />
                    </button>

                    <span className="text-xs font-mono text-[#b3b3b3]">
                      {track.durationStr || "3:30"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {profile.topTracks && profile.topTracks.length > 5 && (
            <button
              onClick={() => setShowAllTracks(!showAllTracks)}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white self-start px-4 py-2 uppercase tracking-wider transition-colors cursor-pointer"
            >
              {showAllTracks ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        {/* Section: Discografía (Álbumes y Sencillos) */}
        {profile.albums && profile.albums.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">Discografía</h2>
              <span className="text-xs font-bold text-[#b3b3b3]">
                {profile.albums.length} lanzamientos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profile.albums.map((album) => (
                <div
                  key={album.id}
                  className="spotify-card p-3 rounded-md flex flex-col gap-3 group cursor-pointer"
                >
                  <div className="relative aspect-square rounded overflow-hidden shadow-lg">
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col truncate">
                    <span className="font-bold text-sm text-white truncate" title={album.title}>
                      {album.title}
                    </span>
                    <span className="text-xs text-[#b3b3b3] mt-0.5">
                      {album.releaseDate} • {album.recordType === "single" ? "Sencillo" : "Álbum"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Fans también escuchan (Artistas Similares) */}
        {profile.relatedArtists && profile.relatedArtists.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Fans también escuchan
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profile.relatedArtists.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArtist?.(rel.id)}
                  className="spotify-card p-4 rounded-md flex flex-col items-center text-center gap-3 group cursor-pointer"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={rel.picture}
                      alt={rel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col truncate w-full">
                    <span className="font-bold text-sm text-white truncate group-hover:underline">
                      {rel.name}
                    </span>
                    <span className="text-xs text-[#b3b3b3] mt-0.5">Artista</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Acerca de (About Card) */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Acerca de</h2>
          <div
            className="relative h-64 sm:h-80 rounded-xl overflow-hidden p-6 flex flex-col justify-end bg-cover bg-center shadow-2xl"
            style={{ backgroundImage: `url(${profile.picture})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col gap-2 max-w-md">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {profile.fansFormatted} oyentes mensuales
              </span>
              <p className="text-xs sm:text-sm text-white/80 line-clamp-3">
                {profile.name} es uno de los artistas más escuchados a nivel mundial, con {profile.nbAlbum} lanzamientos y millones de reproducciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

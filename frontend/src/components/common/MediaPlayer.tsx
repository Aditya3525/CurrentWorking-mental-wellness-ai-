import React, { useState } from 'react';

interface MediaPlayerProps {
  audioUrl?: string | null;
  videoUrl?: string | null;
  youtubeUrl?: string | null;
  className?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (current: number, duration: number) => void;
  onEnded?: () => void;
  fillScreen?: boolean; // when true and YouTube, remove aspect lock and fill parent
}

// Simple YouTube embed ID extractor
function extractYouTubeId(url?: string | null) {
  if (!url) return null;
  // Normalize possible whitespace
  const input = url.trim();
  // Direct ID (11 chars) heuristic if only letters, digits, - _
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input);
    // youtu.be/<id>
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1).split(/[?&#]/)[0];
      if (id) return id;
    }
    // youtube.com/watch?v=<id>
    const watchId = u.searchParams.get('v');
    if (watchId) return watchId;
    // youtube.com/embed/<id>
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    // youtube.com/shorts/<id>
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
  } catch (_) {
    // ignore parse errors
  }
  return null;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ audioUrl, videoUrl, youtubeUrl, className = '', autoPlay, onTimeUpdate, onEnded, fillScreen }) => {
  const ytId = extractYouTubeId(youtubeUrl);
  const [showYouTube, setShowYouTube] = useState(!!autoPlay);

  if (ytId) {
    const thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <div className={`relative ${fillScreen ? 'w-full h-full' : 'w-full aspect-video'} rounded-lg overflow-hidden bg-black ${className}`}>
        {showYouTube ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1${autoPlay ? '&autoplay=1' : ''}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowYouTube(true)}
            className="group w-full h-full relative text-left"
            aria-label="Play YouTube video"
          >
            <img
              src={thumbnail}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M10 15.5v-7l6 3.5-6 3.5z"/></svg>
              </div>
            </div>
          </button>
        )}
      </div>
    );
  }
  if (videoUrl) {
    return (
      <video
        className={`w-full rounded-lg shadow ${className}`}
        controls
        {...(autoPlay ? { autoPlay: true } : {})}
        onTimeUpdate={(e) => {
          const el = e.currentTarget; if (onTimeUpdate) onTimeUpdate(el.currentTime, el.duration || 0);
        }}
        onEnded={() => onEnded && onEnded()}
      >
        <source src={videoUrl} />
        <track kind="captions" srcLang="en" label="English captions" />
        Your browser does not support the video tag.
      </video>
    );
  }
  if (audioUrl) {
    return (
      <audio
        className={`w-full ${className}`}
        controls
        {...(autoPlay ? { autoPlay: true } : {})}
        onTimeUpdate={(e) => {
          const el = e.currentTarget; if (onTimeUpdate) onTimeUpdate(el.currentTime, el.duration || 0);
        }}
        onEnded={() => onEnded && onEnded()}
      >
        <source src={audioUrl} />
        <track kind="captions" srcLang="en" label="Transcript" />
        Your browser does not support the audio element.
      </audio>
    );
  }
  return <div className={`text-sm text-muted-foreground ${className}`}>No media available</div>;
};

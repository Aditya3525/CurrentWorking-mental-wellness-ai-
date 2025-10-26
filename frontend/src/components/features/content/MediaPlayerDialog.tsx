/* eslint-disable jsx-a11y/media-has-caption */
import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../../ui/dialog';
import { ScrollArea } from '../../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Slider } from '../../ui/slider';

import type { LibraryItem } from './types';

interface MediaPlayerDialogProps {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatTime = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds)) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const playbackRates = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function MediaPlayerDialog({ item, open, onOpenChange }: MediaPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const media = item?.media ?? null;
  const isVideo = media?.kind === 'video' && !media.youtubeId;
  const isYouTube = media?.kind === 'video' && !!media.youtubeId;
  const isAudio = media?.kind === 'audio';

  const mediaElement = useMemo(() => (isVideo ? videoRef.current : (isAudio ? audioRef.current : null)), [isVideo, isAudio]);

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      const el = mediaElement;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      return;
    }

    if (mediaElement) {
      mediaElement.volume = volume / 100;
      mediaElement.playbackRate = playbackRate;
    }
  }, [open, mediaElement, volume, playbackRate]);

  useEffect(() => {
    const el = mediaElement;
    if (!el) return;

    const handleLoaded = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    };
    const handleTimeUpdate = () => setCurrentTime(el.currentTime);
    const handleEnded = () => setIsPlaying(false);

    el.addEventListener('loadedmetadata', handleLoaded);
    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('ended', handleEnded);

    return () => {
      el.removeEventListener('loadedmetadata', handleLoaded);
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('ended', handleEnded);
    };
  }, [mediaElement, item?.id]);

  useEffect(() => {
    if (!document) return;
    const handler = () => {
      const fullscreenElement = document.fullscreenElement;
      setIsFullscreen(Boolean(fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePlayback = () => {
    const el = mediaElement;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (values: number[]) => {
    const el = mediaElement;
    if (!el || duration === 0) return;
    const value = values[0];
    const newTime = (value / 100) * duration;
    el.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolume = (values: number[]) => {
    const value = values[0];
    setVolume(value);
    const el = mediaElement;
    if (el) {
      el.volume = value / 100;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    const el = mediaElement;
    if (!el) return;
    if (isMuted || el.volume === 0) {
      el.volume = volume / 100;
      setIsMuted(false);
    } else {
      el.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(80);
    setIsMuted(false);
    setPlaybackRate(1);
  }, [item?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        {item ? (
          <div className="grid lg:grid-cols-[2fr_1fr] min-h-[520px]">
            <div className="bg-black flex flex-col">
              <div className="relative flex-1 flex items-center justify-center bg-black">
                {isVideo && media?.src ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    src={media.src ?? undefined}
                    poster={media.poster ?? undefined}
                    preload="metadata"
                    playsInline
                    onClick={togglePlayback}
                  />
                ) : null}

                {isAudio && media?.src ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-10 text-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <img
                        src={media.poster ?? item.thumbnail ?? '/audio-cover-fallback.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-white text-2xl font-semibold mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-white/70 text-sm max-w-lg mx-auto leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <audio
                      ref={audioRef}
                      src={media.src ?? undefined}
                      preload="metadata"
                      aria-label={`${item.title} audio player`}
                    />
                  </div>
                ) : null}

                {isYouTube && (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${media?.youtubeId}?autoplay=1&rel=0`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {!media && item.displayType === 'article' && (
                  <div className="flex items-center justify-center text-white/80 p-12 text-center">
                    <div>
                      <Radio className="h-12 w-12 mx-auto mb-4" />
                      <p>This content is a guided reading. Scroll to explore the article.</p>
                    </div>
                  </div>
                )}
              </div>

              {!isYouTube && media && (isVideo || isAudio) ? (
                <div className="p-4 bg-slate-950 text-white/90 space-y-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={togglePlayback} className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20">
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
                    </Button>

                    <div className="flex-1 flex flex-col">
                      <Slider
                        value={[currentProgress]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="cursor-pointer"
                        aria-label="Seek"
                      />
                      <div className="flex justify-between text-xs text-white/60 font-mono mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <Button variant="ghost" size="icon" onClick={toggleMute} className="h-9 w-9 bg-white/10 hover:bg-white/20">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        <span className="sr-only">Toggle mute</span>
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolume}
                        max={100}
                        step={1}
                        className="w-32"
                        aria-label="Volume"
                      />
                    </div>

                    <Select value={String(playbackRate)} onValueChange={(value) => {
                      const rate = Number(value);
                      setPlaybackRate(rate);
                      const el = mediaElement;
                      if (el) el.playbackRate = rate;
                    }}>
                      <SelectTrigger className="w-[120px] bg-white/10 border-white/10 text-white">
                        <SelectValue placeholder="Speed" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-white">
                        {playbackRates.map((rate) => (
                          <SelectItem key={rate} value={String(rate)}>
                            {rate === 1 ? '1x (Normal)' : `${rate}x`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isVideo && (
                      <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-9 w-9 bg-white/10 hover:bg-white/20">
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        <span className="sr-only">Toggle fullscreen</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-white dark:bg-slate-950 overflow-y-auto">
              <DialogHeader className="px-6 pt-6 pb-3 space-y-2">
                <DialogTitle className="text-2xl font-semibold leading-snug flex items-start gap-2">
                  {item.title}
                </DialogTitle>
                {item.description && (
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {item.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="px-6 space-y-6 pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  {item.category && <Badge variant="secondary" className="capitalize">{item.category}</Badge>}
                  {item.approach && item.approach !== 'all' && (
                    <Badge variant="outline" className="capitalize">
                      {item.approach}
                    </Badge>
                  )}
                  {item.difficulty && <Badge variant="outline">{item.difficulty}</Badge>}
                  {item.durationLabel && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.durationLabel}
                    </Badge>
                  )}
                  {item.source === 'practice' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" /> Guided Practice
                    </Badge>
                  )}
                </div>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.displayType === 'article' && item.body ? (
                  <div className="rounded-xl border bg-muted/40">
                    <ScrollArea className="h-64 p-5">
                      <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {item.body}
                      </article>
                    </ScrollArea>
                  </div>
                ) : null}

                {media?.youtubeId && (
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={() => {
                      window.open(`https://www.youtube.com/watch?v=${media.youtubeId}`, '_blank', 'noopener');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open on YouTube
                  </Button>
                )}

                {item.displayType !== 'article' && (!media || (!media.youtubeId && !media.src)) && (
                  <div className="text-xs text-muted-foreground">
                    We couldn&apos;t find a playable source for this item yet. Please try another piece or contact an administrator.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">Select a video or audio item to start playback.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
  ListVideo
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
      <DialogContent className={`max-w-6xl p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500 ${isAudio ? 'bg-[#F2F5F3] text-slate-900' : 'bg-slate-950 text-white'
        }`}>
        {item ? (
          <div className="grid lg:grid-cols-[1.8fr_1fr] min-h-[600px]">
            {/* Left Panel: Media Player Area */}
            <div className={`relative flex flex-col ${isAudio ? 'bg-[#E6EBE8] p-12 items-center justify-center' : 'bg-black items-center justify-center group'
              }`}>

              {/* --- VIDEO PLAYER --- */}
              {isVideo && media?.src ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    src={media.src ?? undefined}
                    poster={media.poster ?? undefined}
                    preload="metadata"
                    playsInline
                    onClick={togglePlayback}
                  />

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    <div className="flex flex-col gap-3">
                      {/* Progress Bar */}
                      <Slider
                        value={[currentProgress]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="cursor-pointer [&>.relative>.absolute]:bg-teal-400 [&>.relative]:bg-white/20"
                        aria-label="Seek"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={togglePlayback}
                            className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                          >
                            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-0.5 fill-current" />}
                          </Button>

                          <div className="flex items-center gap-2 group/volume">
                            <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-white/80 hover:text-white">
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Slider
                              value={[isMuted ? 0 : volume]}
                              onValueChange={handleVolume}
                              max={100}
                              step={1}
                              className="w-20 opacity-0 group-hover/volume:opacity-100 transition-all duration-300 [&>.relative>.absolute]:bg-white"
                              aria-label="Volume"
                            />
                          </div>

                          <span className="text-xs font-medium font-mono text-white/70">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select value={String(playbackRate)} onValueChange={(value) => {
                            const rate = Number(value);
                            setPlaybackRate(rate);
                            const el = mediaElement;
                            if (el) el.playbackRate = rate;
                          }}>
                            <SelectTrigger className="h-8 w-[80px] bg-transparent border-none text-white/70 hover:text-white focus:ring-0 text-xs">
                              <SelectValue placeholder="1x" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              {playbackRates.map((rate) => (
                                <SelectItem key={rate} value={String(rate)} className="focus:bg-white/10 focus:text-white">
                                  {rate}x
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 text-white/80 hover:text-white">
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* --- AUDIO PLAYER --- */}
              {isAudio && media?.src ? (
                <div className="w-full max-w-md flex flex-col items-center gap-8">
                  {/* Album Art */}
                  <div className="relative w-72 h-72 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-700 ease-out">
                    <img
                      src={media.poster ?? item.thumbnail ?? '/audio-cover-fallback.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/10 to-transparent mix-blend-overlay" />
                  </div>

                  {/* Audio Controls Container */}
                  <div className="w-full bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50">
                    {/* Progress */}
                    <div className="mb-6 space-y-2">
                      <Slider
                        value={[currentProgress]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="cursor-pointer [&>.relative>.absolute]:bg-teal-600 [&>.relative]:bg-teal-900/10"
                        aria-label="Seek"
                      />
                      <div className="flex justify-between text-xs font-medium text-slate-400 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const el = mediaElement;
                          if (el) el.currentTime = Math.max(0, el.currentTime - 10);
                        }}
                        className="h-10 w-10 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayback}
                        className="h-16 w-16 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
                      >
                        {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 ml-1 fill-current" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const el = mediaElement;
                          if (el) el.currentTime = Math.min(duration, el.currentTime + 10);
                        }}
                        className="h-10 w-10 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      >
                        <RotateCw className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={media.src ?? undefined}
                    preload="metadata"
                    aria-label={`${item.title} audio player`}
                  />
                </div>
              ) : null}

              {/* --- YOUTUBE PLAYER --- */}
              {isYouTube && (
                <div className="relative w-full h-full bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${media?.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Right Panel: Details */}
            <div className={`flex flex-col h-full overflow-hidden ${isAudio ? 'bg-white' : 'bg-slate-900 border-l border-white/5'
              }`}>
              <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      {item.category && (
                        <Badge variant="outline" className={`capitalize ${isAudio ? 'border-teal-100 text-teal-700 bg-teal-50' : 'border-white/10 text-white/60'
                          }`}>
                          {item.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`flex items-center gap-1 ${isAudio ? 'border-slate-100 text-slate-500' : 'border-white/10 text-white/60'
                        }`}>
                        <Clock className="h-3 w-3" />
                        {item.durationLabel || formatTime(duration)}
                      </Badge>
                    </div>

                    <h2 className={`text-2xl font-bold leading-tight ${isAudio ? 'text-slate-900' : 'text-white'
                      }`}>
                      {item.title}
                    </h2>

                    {item.description && (
                      <p className={`text-sm leading-relaxed ${isAudio ? 'text-slate-500' : 'text-white/60'
                        }`}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="space-y-3">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider ${isAudio ? 'text-slate-400' : 'text-white/40'
                        }`}>
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={`border-none ${isAudio
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }`}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Specific: Up Next (Mock) */}
                  {isVideo && (
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                        <ListVideo className="h-4 w-4" />
                        Up Next
                      </h4>
                      <div className="space-y-3">
                        {['Cool Down Stretch', 'Breathing Exercise', 'Evening Meditation'].map((title, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group/item transition-colors">
                            <div className="relative w-20 h-12 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                              <div className="absolute inset-0 flex items-center justify-center text-white/20 group-hover/item:text-white/40">
                                <Play className="h-4 w-4 fill-current" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white/90 group-hover/item:text-white">{title}</p>
                              <p className="text-xs text-white/50">{10 - i * 2} min • Recommended</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Article Content */}
                  {item.displayType === 'article' && item.body && (
                    <div className={`mt-4 prose prose-sm max-w-none ${isAudio ? 'prose-slate' : 'prose-invert'
                      }`}>
                      {item.body}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">Select a video or audio item to start playback.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

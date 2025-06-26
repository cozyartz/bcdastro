import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLoadedMetadata?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  isPreview?: boolean;
  previewDuration?: number; // in seconds
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  controls = true,
  muted = false,
  loop = false,
  width = '100%',
  height = 'auto',
  className = '',
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
  onError,
  isPreview = false,
  previewDuration = 30,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize HLS.js for Cloudflare Stream
    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        setError(`Video loading error: ${data.details}`);
        setIsLoading(false);
        if (onError) onError(data);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      setIsLoading(false);
    } else {
      setError('Video format not supported');
      setIsLoading(false);
    }
  }, [src, autoplay, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (onLoadedMetadata) onLoadedMetadata();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Preview mode - stop after preview duration
      if (isPreview && video.currentTime >= previewDuration) {
        video.pause();
        setIsPlaying(false);
        // Optionally reset to beginning or show purchase modal
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [isPreview, previewDuration, onLoadedMetadata, onPlay, onPause, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = seekTime;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value) / 100;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const previewProgressPercentage = isPreview && duration > 0 ? (previewDuration / duration) * 100 : 100;

  if (error) {
    return (
      <div className={`video-player-error ${className}`}>
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`video-player-container ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="video-loading">
          <div className="loading-spinner"></div>
          <p>Loading video...</p>
        </div>
      )}
      
      <div className="video-wrapper">
        <video
          ref={videoRef}
          poster={poster}
          muted={muted}
          loop={loop}
          className="video-element"
          style={{ width: '100%', height: '100%' }}
        />
        
        {isPreview && (
          <div className="preview-overlay">
            <div className="preview-badge">
              <i className="fas fa-eye"></i>
              Preview ({previewDuration}s)
            </div>
          </div>
        )}

        {controls && (
          <div className="video-controls">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-buffer"
                  style={{ width: `${previewProgressPercentage}%` }}
                />
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={handleSeek}
                  className="progress-input"
                />
              </div>
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="control-buttons">
              <button onClick={togglePlay} className="control-btn play-btn">
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>

              <div className="volume-control">
                <button onClick={toggleMute} className="control-btn volume-btn">
                  <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              {title && (
                <div className="video-title">
                  <span>{title}</span>
                </div>
              )}

              <button onClick={toggleFullscreen} className="control-btn fullscreen-btn">
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
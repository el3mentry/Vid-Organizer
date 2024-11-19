import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset video when source changes
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  const getVideoUrl = (path: string) => {
    // Convert file path to video protocol URL
    if (!path) return '';
    const encodedPath = encodeURIComponent(path);
    return `video://${encodedPath}`;
  };

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      controlsList="nodownload"
      onError={(e) => console.error('Video error:', e)}
    >
      <source src={getVideoUrl(src)} type="video/mp4" />
      Error loading video
    </video>
  );
};

export default VideoPlayer;
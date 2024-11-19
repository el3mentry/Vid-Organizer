import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    if (!src) return;

    try {
      // Clean the path (replace backslashes with forward slashes)
      const cleanPath = src.replace(/\\/g, '/');
      console.log('Original path:', src);
      console.log('Clean path:', cleanPath);
      
      // Create video URL with leading slash
      const url = `video:///${cleanPath}`;
      console.log('Video URL:', url);
      
      setVideoUrl(url);

      // Reset video when source changes
      if (videoRef.current) {
        videoRef.current.load();
      }
    } catch (err) {
      console.error('Error processing video path:', err);
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error('Video error:', {
      currentSrc: video.currentSrc,
      src: video.src,
      error: video.error?.message || 'Unknown error',
      code: video.error?.code,
      networkState: video.networkState,
      readyState: video.readyState
    });
  };

  const handleLoadStart = () => {
    console.log('Video load started:', videoUrl);
  };

  const handleLoadedData = () => {
    console.log('Video loaded successfully');
  };

  return (
    <div className="relative w-full">
      {videoUrl && (
        <video
          ref={videoRef}
          className={`w-full ${className}`}
          controls
          controlsList="nodownload"
          onError={handleError}
          onLoadStart={handleLoadStart}
          onLoadedData={handleLoadedData}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default VideoPlayer;
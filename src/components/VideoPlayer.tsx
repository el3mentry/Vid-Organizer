import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setError(null);
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    setError(target.error?.message || 'Error loading video');
    console.error('Video error:', target.error);
  };

  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center text-gray-500`}>
        No video selected
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center text-red-500`}>
        {error}
      </div>
    );
  }

  // Convert the file path to our custom protocol
  const videoSrc = `local-video://${encodeURIComponent(src)}`;

  return (
    <div className={`${className} max-w-4xl mx-auto`}>
      <video
        ref={videoRef}
        controls
        className="w-full h-full rounded-lg shadow-lg"
        key={src}
        onError={handleError}
      >
        <source src={videoSrc} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
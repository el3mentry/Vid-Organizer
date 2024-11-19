import React from 'react';
import { Video, Clock } from 'lucide-react';
import { VideoFile } from '../types/electron';

interface VideoListProps {
  videos: VideoFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, currentIndex, onSelect }) => {
  // Sort videos by creation date (most recent first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const videoDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - videoDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return videoDate.toLocaleDateString();
    }
  };

  const truncateName = (name: string, maxLength: number = 35) => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  return (
    <div className="h-full bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Files
        </h2>
      </div>
      <div className="overflow-y-auto overflow-x-hidden h-[calc(100vh-16rem)] custom-scrollbar">
        {sortedVideos.map((video, index) => {
          // Find the actual index in the original videos array
          const originalIndex = videos.findIndex(v => v.path === video.path);
          return (
            <button
              key={video.path}
              onClick={() => onSelect(originalIndex)}
              className={`
                w-full text-left p-4 
                flex flex-col gap-1
                border-b border-gray-700/50 last:border-b-0
                transition-colors
                ${
                  originalIndex === currentIndex
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'hover:bg-gray-700/30 text-gray-200'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <Video className="w-4 h-4 flex-shrink-0 mt-1" />
                <span className="line-clamp-3 break-words text-sm">
                  {video.nameWithoutExt}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VideoList;

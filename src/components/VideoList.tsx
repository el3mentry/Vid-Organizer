import React from 'react';
import { Video } from 'lucide-react';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  nameWithoutExt: string;
}

interface VideoListProps {
  videos: VideoFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, currentIndex, onSelect }) => {
  return (
    <div className="h-full bg-gray-50 rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Video Files</h2>
      <div className="overflow-y-auto h-[calc(100vh-200px)] pr-2">
        {videos.map((video, index) => (
          <button
            key={video.path}
            onClick={() => onSelect(index)}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-2 transition-colors ${
              index === currentIndex
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="truncate">{video.nameWithoutExt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoList;

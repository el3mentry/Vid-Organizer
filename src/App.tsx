import React, { useState, useEffect } from 'react';
import { FolderOpen, Play, Forward, Save, Plus, Move } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CategorySelector from './components/CategorySelector';
import DirectorySelector from './components/DirectorySelector';
import { VideoFile, ElectronAPI } from './types/electron';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

function App() {
  const [sourceDir, setSourceDir] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Set initial filename when video changes
  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex < videos.length) {
      const currentVideo = videos[currentVideoIndex];
      setNewFileName(currentVideo.nameWithoutExt);
    }
  }, [currentVideoIndex, videos]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const scanDirectory = async (directory: string) => {
    setError(null);
    setIsProcessing(true);
    setVideos([]); // Clear existing videos
    
    try {
      const videoFiles = await window.electron.scanVideos(directory);
      
      if (videoFiles.length === 0) {
        setError('No video files found in the selected directory');
        setSourceDir('');
        return;
      }
      
      setVideos(videoFiles);
      setCurrentVideoIndex(0);
      setNewFileName(videoFiles[0].nameWithoutExt);
    } catch (error) {
      console.error('Error scanning directory:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan directory');
      setSourceDir(''); // Reset source directory on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveVideo = async () => {
    if (!videos.length || currentVideoIndex >= videos.length) return;
    
    if (selectedCategory && newFileName) {
      setError(null);
      setIsProcessing(true);
      try {
        const currentVideo = videos[currentVideoIndex];
        const response = await fetch('http://localhost:3000/api/organize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceFile: currentVideo.path,
            targetDirectory: targetDir,
            category: selectedCategory,
            newFileName
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to organize video');
        }

        // Remove the moved video from the list
        setVideos(prev => prev.filter((_, index) => index !== currentVideoIndex));
        
        setSelectedCategory('');
        // Adjust current index if necessary
        if (currentVideoIndex >= videos.length - 1) {
          setCurrentVideoIndex(Math.max(videos.length - 2, 0));
        }
        
        setNewFileName('');
      } catch (error) {
        console.error('Error organizing video:', error);
        setError(error instanceof Error ? error.message : 'Failed to organize video');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      const nextVideo = videos[currentVideoIndex + 1];
      setNewFileName(nextVideo.nameWithoutExt);
      setSelectedCategory('');
    }
  };

  const getCurrentVideoPath = () => {
    if (videos.length > 0 && currentVideoIndex < videos.length) {
      return videos[currentVideoIndex].path;
    }
    return '';
  };

  const getCurrentVideoName = () => {
    if (videos.length > 0 && currentVideoIndex < videos.length) {
      return videos[currentVideoIndex].name;
    }
    return 'No video selected';
  };

  const addCategory = async (newCategory: string) => {
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add category');
      }
      
      const updatedCategories = await response.json();
      setCategories(updatedCategories);
      setSelectedCategory(newCategory);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error instanceof Error ? error.message : 'Failed to add category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            <FolderOpen className="w-10 h-10" />
            Video Organizer
          </h1>

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <DirectorySelector
              label="Source Directory"
              value={sourceDir}
              onChange={(dir: string) => {
                setSourceDir(dir);
                if (dir) scanDirectory(dir);
              }}
              icon={FolderOpen}
              disabled={isProcessing}
            />
            <DirectorySelector
              label="Target Directory"
              value={targetDir}
              onChange={setTargetDir}
              icon={FolderOpen}
              disabled={isProcessing}
            />
          </div>

          {isProcessing && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {videos.length > 0 && !isProcessing && (
            <div className="space-y-8">
              <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Play className="w-6 h-6" />
                  Current Video: {getCurrentVideoName()}
                </h2>
                <VideoPlayer
                  src={getCurrentVideoPath()}
                  className="w-full aspect-video bg-black rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-lg font-medium text-white">New File Name</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new file name"
                    disabled={isProcessing}
                  />
                </div>

                <CategorySelector
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onAddCategory={addCategory}
                  disabled={isProcessing}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleMoveVideo}
                  disabled={isProcessing || !selectedCategory || !newFileName || !targetDir}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Move className="w-5 h-5" />
                  Move Video
                </button>

                <button
                  onClick={handleNextVideo}
                  disabled={isProcessing || currentVideoIndex >= videos.length - 1}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Forward className="w-5 h-5" />
                  Next Video
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
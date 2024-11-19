import React, { useState, useEffect } from 'react';
import { FolderOpen, Play, Forward, Save, Plus, Move, FolderInput, FolderOutput } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CategorySelector from './components/CategorySelector';
import DirectorySelector from './components/DirectorySelector';
import Notification from './components/Notification';
import VideoList from './components/VideoList';
import { VideoFile, ElectronAPI } from './types/electron';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

const App: React.FC = () => {
  const [sourceDir, setSourceDir] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [newFileName, setNewFileName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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
    setError(undefined);
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
      setError(undefined);
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
        
        // Show success notification
        setNotificationMessage(`Successfully moved video to ${selectedCategory}`);
        setShowNotification(true);
        
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
    setError(undefined);
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

  const handleSourceDirSelect = async (dir: string) => {
    setSourceDir(dir);
    if (dir) {
      setError(undefined);
      await scanDirectory(dir);
    }
  };

  const handleTargetDirSelect = (dir: string) => {
    setError(undefined);
    setTargetDir(dir);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 relative">
          <Notification
            message={notificationMessage}
            show={showNotification}
            onHide={() => setShowNotification(false)}
          />
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Video Organizer
          </h1>

          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          
          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            {/* Video Navigation Pane */}
            <div className="w-64 flex-shrink-0">
              <VideoList
                videos={videos}
                currentIndex={currentVideoIndex}
                onSelect={setCurrentVideoIndex}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <DirectorySelector
                  label="Source Directory"
                  icon={FolderInput}
                  onSelect={handleSourceDirSelect}
                  selectedPath={sourceDir}
                  error={error}
                  disabled={isProcessing}
                />
                <DirectorySelector
                  label="Target Directory"
                  icon={FolderOutput}
                  onSelect={handleTargetDirSelect}
                  selectedPath={targetDir}
                  error={error}
                  disabled={isProcessing}
                />
              </div>

              <div className="flex-1 bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700 p-6">
                {isProcessing && (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}

                {videos.length > 0 && !isProcessing && (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        Current Video: {getCurrentVideoName()}
                      </h2>
                      <div className="max-w-3xl mx-auto">
                        <VideoPlayer
                          src={getCurrentVideoPath()}
                          className="w-full aspect-video bg-black rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="flex justify-between mt-6">
                      <button
                        onClick={handleNextVideo}
                        disabled={isProcessing || currentVideoIndex >= videos.length - 1}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Forward className="w-4 h-4" />
                        Next Video
                      </button>

                      <button
                        onClick={handleMoveVideo}
                        disabled={isProcessing || !selectedCategory || !newFileName || !targetDir}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Move className="w-4 h-4" />
                        Move Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
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
        <div className="p-8 relative h-screen max-h-[calc(100vh-2rem)]">
          <Notification
            message={notificationMessage}
            show={showNotification}
            onHide={() => setShowNotification(false)}
          />
          <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FolderOpen className="w-6 h-6" />
            Video Organizer
          </h1>

          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
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

              <div className="flex-1 bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700 p-6 flex flex-col">
                {isProcessing && (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}

                {videos.length > 0 && !isProcessing && (
                  <div className="flex flex-col h-full">
                    {/* Video section */}
                    <div className="flex-shrink-0 bg-gray-800/50 p-4 rounded-xl mb-6">
                      <div className="mb-3">
                        <span className="text-lg font-semibold text-white">Current Video:</span>
                        <div className="text-sm text-gray-300 line-clamp-2 mt-1">{getCurrentVideoName()}</div>
                      </div>
                      <div className="max-w-3xl mx-auto">
                        <VideoPlayer
                          src={getCurrentVideoPath()}
                          className="w-full aspect-video bg-black rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Controls section */}
                    <div className="flex-shrink-0 flex flex-col space-y-6 pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            className="
                              w-full px-4 py-3 
                              bg-gray-800/50 
                              border border-gray-600 
                              text-gray-100 
                              rounded-lg 
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                              disabled:opacity-50 disabled:cursor-not-allowed
                              placeholder:text-gray-400
                              hover:bg-gray-800/70 transition-colors
                            "
                            placeholder="Enter new name for the video file"
                            disabled={isProcessing || videos.length === 0}
                          />
                        </div>

                        <CategorySelector
                          categories={categories}
                          selectedCategory={selectedCategory}
                          onSelectCategory={setSelectedCategory}
                          onAddCategory={addCategory}
                          disabled={isProcessing || videos.length === 0}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={handleNextVideo}
                          disabled={isProcessing || currentVideoIndex >= videos.length - 1}
                          className="
                            px-6 py-3
                            bg-gray-700 text-white 
                            rounded-lg 
                            hover:bg-gray-600 
                            transition-colors
                            flex items-center gap-2
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          <Forward className="w-5 h-5" />
                          Next Video
                        </button>

                        <button
                          onClick={handleMoveVideo}
                          disabled={
                            isProcessing || 
                            videos.length === 0 || 
                            !selectedCategory || 
                            !newFileName
                          }
                          className="
                            px-6 py-3
                            bg-blue-600 text-white 
                            rounded-lg 
                            hover:bg-blue-700 
                            transition-colors
                            flex items-center gap-2
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          <Move className="w-5 h-5" />
                          Move Video
                        </button>
                      </div>
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
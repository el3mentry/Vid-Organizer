const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  scanVideos: async (directory) => {
    try {
      const response = await fetch('http://localhost:3000/api/load-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceDir: directory })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan videos');
      }

      const { videos } = await response.json();
      return videos.map(video => ({
        path: video.path,
        name: video.path.split('\\').pop().split('/').pop(),
        nameWithoutExt: video.path.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, ''),
        size: video.size,
        createdAt: new Date(video.createdAt)
      }));
    } catch (error) {
      console.error('Error scanning videos:', error);
      throw error;
    }
  },
  moveVideo: (source, target) => ipcRenderer.invoke('move-video', source, target),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (category) => ipcRenderer.invoke('add-category', category)
});
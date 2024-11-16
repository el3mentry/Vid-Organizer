const { contextBridge, ipcRenderer } = require('electron');

// Safely wrap IPC calls
const electronHandler = {
  selectDirectory: async () => {
    try {
      return await ipcRenderer.invoke('select-directory');
    } catch (error) {
      console.error('Error selecting directory:', error);
      throw error;
    }
  },
  scanVideos: async (directory) => {
    try {
      return await ipcRenderer.invoke('scan-videos', directory);
    } catch (error) {
      console.error('Error scanning videos:', error);
      throw error;
    }
  },
  getFileNameWithoutExt: async (filename) => {
    try {
      return await ipcRenderer.invoke('get-filename-without-ext', filename);
    } catch (error) {
      console.error('Error getting filename without extension:', error);
      throw error;
    }
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', electronHandler);
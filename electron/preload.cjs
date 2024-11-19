const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  scanVideos: (directory) => ipcRenderer.invoke('scan-videos', directory),
  moveVideo: (source, target) => ipcRenderer.invoke('move-video', source, target),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (category) => ipcRenderer.invoke('add-category', category)
});
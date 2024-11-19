const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const isDev = process.env.NODE_ENV === 'development';

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/index.html');
  }
}

// Register custom protocol for video files
function registerVideoProtocol() {
  protocol.registerFileProtocol('video', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('video://', ''));
    try {
      if (fsSync.existsSync(filePath)) {
        return callback({ path: filePath });
      } else {
        console.error('Video file not found:', filePath);
        callback({ error: -6 }); // File not found
      }
    } catch (error) {
      console.error('Protocol error:', error);
      callback({ error: -2 }); // Failed
    }
  });
}

app.whenReady().then(() => {
  registerVideoProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// Handle video scanning
ipcMain.handle('scan-videos', async (event, directory) => {
  try {
    const files = await fs.readdir(directory);
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    
    const videoFiles = [];
    for (const file of files) {
      const filePath = path.join(directory, file);
      try {
        // Use synchronous version for stats to avoid too many open handles
        const stats = fsSync.statSync(filePath);
        
        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (videoExtensions.includes(ext)) {
            videoFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              nameWithoutExt: path.parse(file).name,
              createdAt: stats.birthtime
            });
          }
        }
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
      }
    }

    return videoFiles;
  } catch (error) {
    console.error('Error scanning videos:', error);
    throw error;
  }
});
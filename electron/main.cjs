const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs').promises;

let mainWindow = null;

// Register custom protocol
app.whenReady().then(() => {
  protocol.registerFileProtocol('local-video', (request, callback) => {
    const filePath = request.url.replace('local-video://', '');
    try {
      return callback({ path: decodeURIComponent(filePath) });
    } catch (error) {
      console.error('Protocol error:', error);
      callback({ error: -2 /* net::FAILED */ });
    }
  });
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    show: false  // Don't show the window until it's ready
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173').catch(console.error);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    })).catch(console.error);
  }

  // Show window when ready to render
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle any renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
  });

  // Handle failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) {
    throw new Error('Window is not available');
  }

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting directory:', error);
    throw error;
  }
});

// Handle video scanning
ipcMain.handle('scan-videos', async (event, directory) => {
  try {
    const files = await fs.readdir(directory);
    const videoFiles = [];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

    for (const file of files) {
      try {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (videoExtensions.includes(ext)) {
            videoFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              nameWithoutExt: path.parse(file).name
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

// Handle getting filename without extension
ipcMain.handle('get-filename-without-ext', async (event, filename) => {
  return path.parse(filename).name;
});
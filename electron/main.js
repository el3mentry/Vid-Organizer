const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') 
    {
    win.loadURL('http://localhost:5173');
    // Open DevTools in development
    win.webContents.openDevTools();
    } 
  
  else 
  {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle any renderer process crashes
  win.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details.reason);
    // Reload the window
    win.reload();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting directory:', error);
    throw error; // This will be caught by the renderer process
  }
});
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'video',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      stream: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      corsEnabled: true
    }
  }
]);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: isDev,
      webSecurity: true,
      webviewTag: true
    },
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' video: blob: data:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
          "style-src 'self' 'unsafe-inline';",
          "media-src 'self' video: blob: data: filesystem:;",
          "img-src 'self' data: video:;",
          "connect-src 'self' http://localhost:* ws://localhost:*;"
        ].join(' ')
      }
    });
  });

  // Disable Chrome Autofill
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      document.querySelectorAll('input, textarea').forEach(element => {
        element.setAttribute('autocomplete', 'off');
      });
    `);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Only open devTools if explicitly needed during development
    if (process.env.OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile('dist/index.html');
  }
}

// Register custom protocol for video files
function registerVideoProtocol() {
  protocol.handle('video', (request) => {
    try {
      // Extract file path from URL, handling the leading slash
      const rawPath = request.url.slice('video://'.length);
      console.log('Raw URL path:', rawPath);

      // Remove any leading slashes and decode
      const filePath = decodeURIComponent(rawPath.replace(/^\/+/, ''));
      console.log('Decoded file path:', filePath);

      // On Windows, ensure drive letter format is correct
      const normalizedPath = process.platform === 'win32' 
        ? filePath.replace(/^([a-zA-Z])\//, '$1:/') 
        : filePath;
      
      console.log('Normalized path:', normalizedPath);

      // Check if file exists
      if (!fsSync.existsSync(normalizedPath)) {
        console.error('File not found:', normalizedPath);
        return new Response('File not found', { 
          status: 404,
          statusText: `File not found: ${normalizedPath}`,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Get file stats
      const stats = fsSync.statSync(normalizedPath);
      if (!stats.isFile()) {
        console.error('Not a file:', normalizedPath);
        return new Response('Not a file', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Get MIME type
      const ext = path.extname(normalizedPath).toLowerCase();
      let mimeType = 'video/mp4';
      switch (ext) {
        case '.webm':
          mimeType = 'video/webm';
          break;
        case '.ogg':
          mimeType = 'video/ogg';
          break;
        case '.mov':
          mimeType = 'video/quicktime';
          break;
        case '.avi':
          mimeType = 'video/x-msvideo';
          break;
      }

      console.log('Serving video file:', {
        path: normalizedPath,
        size: stats.size,
        type: mimeType
      });

      // Handle range requests
      const range = request.headers.get('range');
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;

        const stream = fsSync.createReadStream(normalizedPath, { start, end });
        return new Response(stream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // Return full file
      const stream = fsSync.createReadStream(normalizedPath);
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': stats.size.toString(),
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      console.error('Protocol handler error:', error);
      return new Response(error.message, { 
        status: 500,
        statusText: error.message,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
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

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// Video protocol registration
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'video',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      stream: true,
      secure: true,
      corsEnabled: true
    }
  }
]);
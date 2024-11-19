import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Increase the request size limit to handle large directories
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Store categories in a JSON file
const categoriesPath = path.join(__dirname, 'categories.json');

// Initialize categories if file doesn't exist
try {
  await fs.access(categoriesPath);
} catch {
  await fs.writeFile(categoriesPath, JSON.stringify([
    'Food Videos',
    'Sports Videos',
    'General Humor',
    'Travel Videos',
    'Perspective on Life'
  ]));
}

app.get('/api/categories', async (req, res) => {
  try {
    const categories = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'));
    res.json(categories);
  } catch (error) {
    console.error('Error reading categories:', error);
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { category } = req.body;
    const categories = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'));
    if (!categories.includes(category)) {
      categories.push(category);
      await fs.writeFile(categoriesPath, JSON.stringify(categories));
    }
    res.json(categories);
  } catch (error) {
    console.error('Error updating categories:', error);
    res.status(500).json({ error: 'Failed to update categories' });
  }
});

app.post('/api/scan-directory', async (req, res) => {
  try {
    const { directory } = req.body;
    
    // Normalize the path to handle Windows backslashes
    const normalizedPath = path.normalize(directory);
    
    // Check if directory exists
    await fs.access(normalizedPath);
    
    const files = await fs.readdir(normalizedPath);
    const videoFiles = [];
    
    // Get detailed information about each file
    for (const file of files) {
      try {
        const filePath = path.join(normalizedPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            videoFiles.push(file);
          }
        }
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        // Continue with other files even if one fails
      }
    }
    
    res.json(videoFiles);
  } catch (error) {
    console.error('Error scanning directory:', error);
    res.status(500).json({ 
      error: 'Failed to scan directory',
      details: error.message 
    });
  }
});

app.post('/api/organize', async (req, res) => {
  try {
    const { sourceFile, targetDirectory, category, newFileName } = req.body;
    
    // Normalize paths
    const normalizedSourceFile = path.normalize(sourceFile);
    const normalizedTargetDirectory = path.normalize(targetDirectory);
    
    // Create category directory
    const categoryDir = path.join(normalizedTargetDirectory, category);
    await fs.mkdir(categoryDir, { recursive: true });
    
    // Get file extension and create target path
    const ext = path.extname(normalizedSourceFile);
    const targetPath = path.join(categoryDir, `${newFileName}${ext}`);
    
    // Check if source file exists
    await fs.access(normalizedSourceFile);
    
    // Move the file
    await fs.rename(normalizedSourceFile, targetPath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error organizing file:', error);
    res.status(500).json({ 
      error: 'Failed to organize file',
      details: error.message 
    });
  }
});

const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'];

// Recursive function to get all video files from a directory and its subdirectories
async function getVideoFilesRecursively(dir) {
  const videoFiles = [];
  
  async function scanDirectory(currentDir) {
    try {
      const files = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(currentDir, file.name);
        
        if (file.isDirectory()) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath);
        } else if (file.isFile()) {
          // Check if file has a video extension
          const ext = path.extname(file.name).toLowerCase();
          if (videoExtensions.includes(ext)) {
            try {
              const stats = await fs.stat(fullPath);
              videoFiles.push({
                path: fullPath,
                size: stats.size,
                createdAt: stats.birthtime
              });
            } catch (error) {
              console.error(`Error getting stats for file ${fullPath}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}:`, error);
    }
  }

  await scanDirectory(dir);
  return videoFiles;
}

app.post('/api/load-videos', async (req, res) => {
  try {
    const { sourceDir } = req.body;
    if (!sourceDir) {
      return res.status(400).json({ error: 'Source directory is required' });
    }

    console.log('Loading videos from:', sourceDir);
    const videoFiles = await getVideoFilesRecursively(sourceDir);
    console.log(`Found ${videoFiles.length} videos (including subdirectories)`);
    
    res.json({ videos: videoFiles });
  } catch (error) {
    console.error('Error loading videos:', error);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

app.post('/api/move-video', async (req, res) => {
  try {
    const { sourcePath, targetDir, newFileName, category } = req.body;

    if (!sourcePath || !targetDir || !newFileName || !category) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create category directory if it doesn't exist
    const categoryDir = path.join(targetDir, category);
    try {
      await fs.mkdir(categoryDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Get file extension from source file
    const ext = path.extname(sourcePath);
    
    // Create target path with new filename
    const targetPath = path.join(categoryDir, `${newFileName}${ext}`);

    // Move the file
    await fs.rename(sourcePath, targetPath);
    console.log(`Moved video from ${sourcePath} to ${targetPath}`);

    res.json({ success: true, newPath: targetPath });
  } catch (error) {
    console.error('Error moving video:', error);
    res.status(500).json({ error: 'Failed to move video' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
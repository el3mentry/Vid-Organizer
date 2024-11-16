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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// main.js (Root folder)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = new BrowserWindow({
  title: "Pawn Shop Management",
  width: 1200,
  height: 800,
});
let apiProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'build/icon.ico'),
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Remove the default menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  // Check if we are running the compiled .exe or running locally in dev
  if (app.isPackaged) {
    // UPDATED PATH: removed 'frontend' to point directly to the new dist location
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // In development, load the Vite server
    mainWindow.loadURL('http://localhost:5173');
  }
}

function startPythonApi() {
  if (app.isPackaged) {
    // UPDATED PATH: Pointing directly to the single executable
    const apiPath = path.join(process.resourcesPath, 'pawnshop_api.exe');
    
    // We also add a quick try-catch block to prevent hard crashes if it fails again
    try {
      apiProcess = spawn(apiPath);
      apiProcess.stdout.on('data', (data) => console.log(`API: ${data}`));
      apiProcess.stderr.on('data', (data) => console.error(`API Error: ${data}`));
    } catch (err) {
      console.error("Failed to start API process:", err);
    }
  } else {
    console.log("Running in dev mode. Assuming uvicorn is running manually.");
  }
}

app.whenReady().then(() => {
  startPythonApi();
  createWindow();
});

// Safely kill the Python server when the user closes the app
app.on('before-quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
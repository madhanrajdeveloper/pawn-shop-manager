const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Variable declarations
let mainWindow;
let apiProcess = null;

/**
 * Forcefully terminates the Python API process on Windows.
 * Standard apiProcess.kill() often leaves "orphan" processes.
 */
const killPython = () => {
    if (apiProcess) {
        if (process.platform === 'win32') {
            // /f = force, /t = tree (kills child processes too)
            spawn('taskkill', ['/pid', apiProcess.pid, '/f', '/t']);
        } else {
            apiProcess.kill();
        }
        apiProcess = null;
    }
};

function createWindow() {
    mainWindow = new BrowserWindow({
        title: "Pawn Shop Management Software", 
        icon: path.join(__dirname, 'build', 'icon.ico'),
        width: 1280,
        height: 800,
        show: false, // Don't show immediately to prevent white flicker
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Remove the default menu bar for a professional desktop look
    mainWindow.setMenuBarVisibility(false);

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    // Smooth show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startPythonApi() {
    if (app.isPackaged) {
        /**
         * UPDATED PATH FOR V2:
         * We map 'backend/dist/PawnShop' to 'backend_server' in extraResources.
         * The executable inside that folder is 'PawnShop.exe'.
         */
        const apiPath = path.join(process.resourcesPath, 'backend_server', 'PawnShop.exe');
        
        try {
            apiProcess = spawn(apiPath, [], {
                windowsHide: true // Prevents black terminal window popups
            });
            
            apiProcess.stdout.on('data', (data) => console.log(`API: ${data}`));
            apiProcess.stderr.on('data', (data) => console.error(`API Error: ${data}`));
            
            apiProcess.on('error', (err) => {
                console.error("Failed to start API process:", err);
            });
        } catch (err) {
            console.error("Critical error spawning API:", err);
        }
    } else {
        console.log("Dev mode: Ensure FastAPI is running on port 8000.");
    }
}

// THE CORRECT LIFECYCLE: Wait for ready, then start API, then create Window
app.whenReady().then(() => {
    startPythonApi();
    
    // Give the API 1 second to initialize before opening the UI
    setTimeout(() => {
        createWindow();
    }, 1000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Safely kill the Python server when the user is quitting the app
app.on('before-quit', () => {
    killPython();
});

// Ensures the API dies when all windows are closed
app.on('window-all-closed', () => {
    killPython();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
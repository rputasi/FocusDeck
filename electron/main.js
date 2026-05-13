import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  rebuildTray();

  // Listen for achievement unlocks from renderer
  mainWindow.webContents.on('ipc-message-sync', () => {});
}

function rebuildTray() {
  if (tray) tray.destroy();

  const iconPath = path.join(__dirname, '..', 'public', 'icon.png');
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open FocusDesk',
      click: () => mainWindow.show(),
    },
    {
      label: 'Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.executeJavaScript(`
          const btn = document.getElementById('nav-dashboard');
          if (btn) btn.click();
        `);
      },
    },
    {
      label: 'Start Pomodoro',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.executeJavaScript(`
          document.getElementById('pomodoro-start')?.click();
        `);
      },
    },
    {
      label: 'Quick Task',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.executeJavaScript(`
          const input = document.getElementById('task-input');
          if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth' }); }
        `);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('FocusDesk - Productivity OS');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe'),
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

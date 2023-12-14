const fs = require('fs').promises;
const path = require('node:path')
const isDev = require('electron-is-dev');
const electron = require("electron");

const { 
  app, globalShortcut, BrowserWindow, 
  ipcMain, Menu, Tray, IpcMainEvent 
} = electron

const DEFAULT_WIDTH : number = 600;
const DEFAULT_HEIGHT : number = 500;

// app.commandLine.appendSwitch('--force_high_performance_gpu');
// app.commandLine.appendSwitch('--enable-unsafe-webgpu');

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width  : DEFAULT_WIDTH,
    height : DEFAULT_HEIGHT,
    webPreferences : {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  window.on('show', () => window.focus());

  if (isDev) {
    window.loadURL(`http://localhost:${process.env.PORT || 8080}`);
    window.webContents.openDevTools();
  } else {
    window.removeMenu();
    window.loadFile(path.join(__dirname, 'index.html'));
  }
})

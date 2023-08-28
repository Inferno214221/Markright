const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require("path")
const fs = require("fs-extra");

const createWindow = () => {
    win = new BrowserWindow({
        width: 1120,
        height: 630,
        minWidth: 810,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, "./markright.png"),
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
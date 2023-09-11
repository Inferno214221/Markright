const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require("path")
const fs = require("fs-extra");
const marked = require("marked");

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
        icon: path.join(__dirname, "markright.png"),
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    // TESTS
    // startFileReading(path.join(__dirname, "GPLv3.md"));
    // renderMarkdown(startFileReading(path.join(__dirname, "GPLv3.md")));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on("startFileReading", (event, file) => {
    startFileReading(file);
});

function startFileReading(file) {
    if (!fs.existsSync(file)) {
        win.webContents.send("throwError", "File does not exist.");
    }
    console.log("Reading File: " + file);
    let fileContents = fs.readFileSync(file, { encoding: "utf-8" });
    win.webContents.send("from_startFileReading", fileContents);
    return fileContents;
}

ipcMain.on("renderMarkdown", (event, markdown) => {
    renderMarkdown(markdown);
});

function renderMarkdown(markdown) {
    let renderedMarkdown = marked.parse(markdown, { gfm: true });
    win.webContents.send("from_renderMarkdown", renderedMarkdown);
    return renderedMarkdown;
}
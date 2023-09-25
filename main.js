const { app, BrowserWindow, Menu, ipcMain, dialog, shell, MenuItem } = require('electron');
const path = require("path")
const fs = require("fs-extra");
const marked = require("marked");

var openDir = null;
var history = require(path.join(__dirname, "history.json"));

const createWindow = () => {
    win = new BrowserWindow({
        width: 1200,
        height: 670,
        minWidth: 1190,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
        // autoHideMenuBar: true,
        icon: path.join(__dirname, "markright.png"),
    });

    // win.loadFile('index.html');
    win.loadFile("html/editor.html").then(() => {
        if (history.dir != "") {
            openDir = history.dir;
            scanFolder();
        }
        if (history.file != "") {
            fileRead(history.file);
        }
    });
}

const editorMenu = [
    {
        label: "File",
        submenu: [
            {
                label: "New File",
                accelerator: "CmdOrCtrl+N",
                click: function () { console.log("New File"); },
            },
            {
                label: "New Folder",
                accelerator: "CmdOrCtrl+Shift+N",
                click: function () { console.log("New Folder"); },
            },
            { type: 'separator' },
            {
                label: "Open File",
                accelerator: "CmdOrCtrl+O",
                click: function () { fileOpen(); },
            },
            {
                label: "Open Folder",
                accelerator: "CmdOrCtrl+Shift+O",
                click: function () { openFolder(); },
            },
            { type: 'separator' },
            {
                label: "Save",
                accelerator: "CmdOrCtrl+S",
                click: function () { win.webContents.send("save"); },
            },
            { type: 'separator' },
            {
                role: "quit",
            },
        ],
    },
    {
        role: "editMenu",
        submenu: [
            {
                role: "undo"
            },
            {
                role: "redo",
                accelerator: "CmdOrCtrl+Y",
            },
            { type: 'separator' },
            {
                role: "copy"
            },
            {
                role: "cut"
            },
            {
                role: "paste"
            },
            {
                label: "Paste Unformatted",
                role: "pasteAndMatchStyle"
            },
            { type: 'separator' },
            {
                label: "Find",
                accelerator: "CmdOrCtrl+F",
                click: function () { console.log("Find"); },
            },
            {
                label: "Replace",
                accelerator: "CmdOrCtrl+H",
                click: function () { console.log("Replace"); },
            },
            { type: 'separator' },
            {
                role: "selectAll"
            },
            {
                role: "delete"
            },
        ],
    },
    {
        role: "viewMenu",
    },
    {
        role: "windowMenu",
    },
    {
        role: "help",//TODO: reslove help menu
    }
];

const openMenu = [
    {
        label: "File",
        submenu: [
            {
                label: "New File",
                accelerator: "CmdOrCtrl+N",
                click: function () { console.log("New File"); },
            },
            {
                label: "New Folder",
                accelerator: "CmdOrCtrl+Shift+N",
                click: function () { console.log("New Folder"); },
            },
            { type: 'separator' },
            {
                label: "Open File",
                accelerator: "CmdOrCtrl+O",
                click: function () { fileOpen(); },
            },
            {
                label: "Open Folder",
                accelerator: "CmdOrCtrl+Shift+O",
                click: function () { openFolder(); },
            },
            { type: 'separator' },
            {
                role: "quit",
            },
        ],
    },
    {
        role: "viewMenu",
    },
    {
        role: "windowMenu",
    },
    {
        role: "help",//TODO: reslove help menu
    }
];

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.on("setEditorMenu", (event, args) => {
    let menu = Menu.buildFromTemplate(editorMenu);
    Menu.setApplicationMenu(menu);
});

ipcMain.on("setOpenMenu", (event, args) => {
    let menu = Menu.buildFromTemplate(openMenu);
    Menu.setApplicationMenu(menu);
});

ipcMain.on("fileRead", (event, file) => {
    fileRead(file);
});

function fileRead(file) {
    if (!fs.existsSync(file)) {
        win.webContents.send("throwError", "File does not exist.");
    }
    console.log("Reading File: " + file);
    let fileContents = fs.readFileSync(file, { encoding: "utf-8" });
    win.webContents.send("from_fileRead", {
        fileContents: fileContents,
        currentFile: {
            name: path.parse(file).base,
            path: file,
        },
    });
    history.file = file;
    writeHistory();
    return fileContents;
}

ipcMain.on("renderMarkdown", (event, markdown) => {
    renderMarkdown(markdown);
});

function renderMarkdown(markdown) {
    let renderedMarkdown = marked.parse(markdown, { gfm: true, breaks: true });
    win.webContents.send("from_renderMarkdown", renderedMarkdown);
    return renderedMarkdown;
}

ipcMain.on("fileWrite", (event, data) => {
    fileWrite(data.file, data.fileContents);
});

function fileWrite(file, fileContents) {
    fs.ensureFileSync(file);
    console.log("Writing To File: " + file);
    fs.writeFileSync(file, fileContents, { encoding: "utf-8" });
    win.webContents.send("from_fileWrite");
}

function openFolder() {
    dialog.showOpenDialog(win, {
        properties: ["openDirectory"]
    }).then(dir => {
        if (dir.canceled === true) {
            return;
        }
        openDir = dir.filePaths[0];
        scanFolder();
        history.dir = openDir;
        writeHistory();
    });
}

function fileOpen() {
    dialog.showOpenDialog(win, {
        properties: ["openFile"]
    }).then(file => {
        if (file.canceled === true) {
            return;
        }
        fileRead(file.filePaths[0]);
    });
}

function scanFolder() {
    let fsTree = getTree(openDir);
    console.log(fsTree);
    win.webContents.send("from_scanFolder", fsTree);
}

function getTree(dir) {
    let dirs = [];
    let files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
        if (file.name.startsWith(".")) {
            console.log("Hidden File / Folder: " + file.name);
        } else if (file.isDirectory()) {
            dirs.push(getTree(path.join(dir, file.name)));
        } else if (path.parse(file.name).ext.toLowerCase() == ".md") {
            files.push({
                name: path.parse(file.name).base,
                path: path.join(dir, file.name),
            });
        }
    });
    return {
        name: path.parse(dir).base,
        files: files,
        subDirs: dirs,
        collapsed: true,
    };
}

function writeHistory() {
    fs.writeFileSync(path.join(__dirname, "history.json"), JSON.stringify(history, null, 2), "utf-8");
}
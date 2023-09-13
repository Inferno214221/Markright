const { app, BrowserWindow, Menu, ipcMain, dialog, shell, MenuItem } = require('electron');
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
        // autoHideMenuBar: true,
        icon: path.join(__dirname, "markright.png"),
    });

    win.loadFile('index.html');
}

const editorMenu = [
    {
        label: "File",
        submenu: [
            {
                label: "Save",
                accelerator: "Ctrl+S",
                click: function () { win.webContents.send("save"); },
            },
            {
                role: "quit",
            },
        ],
    },
    {
        role: "editMenu",
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

    // TESTS
    // fileRead(path.join(__dirname, "GPLv3.md"));
    // renderMarkdown(fileRead(path.join(__dirname, "GPLv3.md")));
    // fileWrite(path.join(__dirname, "Test.md"), fileRead(path.join(__dirname, "Test.md")) + "\nEEEEEE");

    // MENU
    // const menu = Menu.buildFromTemplate(menuTemplate);
    // Menu.setApplicationMenu(menu);
    // menu = Menu.getApplicationMenu();
    // console.log(menu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
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
    win.webContents.send("from_fileRead", fileContents);
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

ipcMain.on("fileWrite", (event, data) => {
    fileWrite(data.file, data.fileContents);
});

function fileWrite(file, fileContents) {
    fs.ensureFileSync(file);
    console.log("Writing To File: " + file);
    fs.writeFileSync(file, fileContents, { encoding: "utf-8" });
    win.webContents.send("from_fileWrite");
}
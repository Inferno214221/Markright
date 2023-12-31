const { app, BrowserWindow, Menu, ipcMain, dialog, shell, MenuItem } = require('electron');
const path = require("path")
const fs = require("fs-extra");
const marked = require("marked");

var openDir = null;
const HISTORY_FILE = path.join(app.getPath("userData"), "history.json");
var history;
if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE));
} else {
    history = {
        "file": "",
        "files": [],
        "dir": ""
    };
}

const createWindow = () => {
    win = new BrowserWindow({
        width: 1200,
        height: 670,
        minWidth: 950,
        minHeight: 480,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
        // autoHideMenuBar: true,
        icon: path.join(__dirname, "markright.svg"),
    });

    // win.loadFile('index.html');
    win.loadFile("html/editor.html");
    let menu = Menu.buildFromTemplate(editorMenu);
    Menu.setApplicationMenu(menu);
}

const editorMenu = [
    {
        label: "File",
        submenu: [
            // {
            //     label: "New File",
            //     accelerator: "CmdOrCtrl+N",
            //     click: function () { console.log("New File"); },
            // },
            // {
            //     label: "New Folder",
            //     accelerator: "CmdOrCtrl+Shift+N",
            //     click: function () { console.log("New Folder"); },
            // },
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
                label: "Close File",
                accelerator: "CmdOrCtrl+W",
                click: function () { fileClose(); },
            },
            {
                label: "Close Folder",
                accelerator: "CmdOrCtrl+Shift+W",
                click: function () { closeFolder(); },
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
                click: function () { find(); },
            },
            {
                label: "Replace",
                accelerator: "CmdOrCtrl+H",
                click: function () { replace(); },
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
        role: "help",
        submenu: [
            {
                label: "Open Demo Document",
                click: function () { fileRead(path.join(__dirname, "gfm-test.md")); },
            },
        ],
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

// https://github.com/markedjs/marked/issues/1538
// Included from Rocky Yang on GitHub {
const katex = require("katex");

const renderer = new marked.Renderer();

const replacer = (((blockRegex, inlineRegex) => (text) => {
    text = text.replace(blockRegex, (match, expression) => {
        let rendered;
        try {
            rendered = katex.renderToString(expression, {displayMode: true});
        } catch (error) {
            // rendered = "<p>(An error occured rendering maths input!)</p>";
            rendered = "<p>" + expression + "</p>";
        }
        return rendered;
    });

    text = text.replace(inlineRegex, (match, expression) => {
        let rendered;
        try {
            rendered = katex.renderToString(expression, {displayMode: false});
        } catch (error) {
            // rendered = "<p>(An error occured rendering maths input!)</p>";
            rendered = "<p>" + expression + "</p>";
        }
        return rendered;
    });

    return text;
})(/\$\$([\s\S]+?)\$\$/g, /\$([^\n\s]+?)\$/g));

const replaceTypes = ["listitems", "paragraph", "tablecell", "text"];
replaceTypes.forEach(type => {
    const original = renderer[type];
    renderer[type] = (...args) => {
        args[0] = replacer(args[0]);
        return original(...args);
    };
});
//}

ipcMain.on("openLast", (event, args) => {
    if (history.dir != "" && fs.existsSync(history.dir)) {
        openDir = history.dir;
        scanFolder();
    }
    if (history.file != "" && fs.existsSync(history.file)) {
        fileRead(history.file);
    }
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
    let renderedMarkdown = marked.parse(markdown, { gfm: true, breaks: true, renderer: renderer });
    renderedMarkdown = renderedMarkdown.replaceAll("</span><br><span", "</span><span");
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

function fileClose() {
    win.webContents.send("fileClose");
    history.file = "";//TODO: multiple file support
    writeHistory();
}

function closeFolder() {
    win.webContents.send("closeFolder");
    history.dir = "";
    writeHistory();
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
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

function find() {
    win.webContents.send("find");
}

function replace() {
    win.webContents.send("replace");
}

ipcMain.on("openLink", (event, url) => {
    shell.openExternal(url);
});
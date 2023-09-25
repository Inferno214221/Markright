var openFsTree, currentFile;

this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.receive("from_fileRead", (data) => {
    markdownInput.value = data.fileContents;
    currentFile = data.currentFile;
    renderMarkdown();
    updateTitle();
});

this.api.receive("save", () => {
    fileWrite();
});

function fileWrite() {
    if (currentFile == undefined) {
        return;
    }
    this.api.send("fileWrite", {
        file: currentFile.path,
        fileContents: markdownInput.value,
    });
}

this.api.receive("from_fileWrite", (fileContents) => {
    //TODO: add on page output
    alert("File Written.");
});

function renderMarkdown() {
    this.api.send("renderMarkdown", markdownInput.value);
    // console.log("Initiating Markdown Rendering: " + new Date().getTime());
}

this.api.receive("from_renderMarkdown", (renderedMarkdown) => {
    markdownOutput.innerHTML = renderedMarkdown;
    wordCount();
    // console.log("Finished Markdown Rendering: " + new Date().getTime());
});

function fileOpen(path) {
    this.api.send("fileRead", path);
}

this.api.receive("from_scanFolder", (fsTree) => {
    openFsTree = fsTree;
    renderFsTree();
    updateTitle();
});

function renderFsTree() {
    let output = "<ul style=\"padding: 0px;\">\n";
    output += outputDir(openFsTree, []);
    output += "</ul>";
    fsTreeOutput.innerHTML = output;
}

function outputDir(folder, parents) {
    // console.log(parents);
    let output = "";
    folder.subDirs.forEach((dir, index) => {
        let newParents = [...parents];
        newParents.push(index);
        output += "<li>\n\
            <button onclick=\"folderToggle('" + JSON.stringify(newParents) + "')\">\n\
                <img src=\"../img/folder.svg\" class=\"fsIcon\">\n\
                <span class=\"fsSpan\">" + dir.name + "</span>\n\
            </button>\n";
        if (!dir.collapsed) {
            output += "<ul>\n";
            output += outputDir(dir, newParents);
            output += "</ul>\n";
        }
        output += "</li>";
        
    });
    folder.files.forEach((file) => {
        output += "<li>\n\
            <button onclick=\"fileOpen('" + file.path + "');\">\n\
                <img src=\"../img/file.svg\" class=\"fsIcon\">\n\
                <span class=\"fsSpan\">" + file.name.slice(0, -3) + "</span>\n\
            </button>\n\
        </li>";
        
    });
    return output;
}

function folderToggle(parents) {
    parents = JSON.parse(parents);
    console.log(parents);
    let currentDir = openFsTree;
    parents.forEach((key) => {
        console.log(key);
        currentDir = currentDir.subDirs[key];
    });
    currentDir.collapsed = !currentDir.collapsed;
    renderFsTree();
}

//onclick="document.getElementById('resizeMe').style.width = 'calc(100% - ' + this.style.width + ')'; document.getElementById('resizeMe').style.left = this.style.width;"

function wordCount() {
    wordCountOut.innerHTML = "Words: " + markdownOutput.innerHTML
    .replaceAll(/(<([^>]+)>)/ig, " ")
    .split(/\s+/)
    .filter((string) => string != "" && string != "\n" && string != "\r")
    .length;
}

function findAndReplace()  {
    find = "Flavored";
    replace = "Haha";
    markdownInput.value = markdownInput.value.replaceAll(find, replace);
    renderMarkdown();
}

function updateTitle() {
    if (openFsTree != undefined) {
        document.title = "Markright | " + openFsTree.name;
    } else if (currentFile != undefined) {
        document.title = "Markright | " + currentFile.name;
    } else {
        document.title = "Markright | No Open File Or Folder";
    }
}
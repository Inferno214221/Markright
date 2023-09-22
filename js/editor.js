var openFsTree;

this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.send("fileRead", "./gfm-test.md");

this.api.receive("from_fileRead", (fileContents) => {
    markdownInput.value = fileContents;
    renderMarkdown();
});

this.api.receive("save", () => {
    fileWrite();
});

function fileWrite() {
    //TODO: add trigger
    this.api.send("fileWrite", {
        file: "./gfm-test.md",
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
    // console.log("Finished Markdown Rendering: " + new Date().getTime());
});

function fileOpen(path) {
    this.api.send("fileRead", path);
}

this.api.receive("from_scanFolder", (fsTree) => {
    openFsTree = fsTree;
    renderFsTree();
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
        newParents.push(index)
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
var openFsTree, currentFile;
var found = 0;

this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.receive("from_fileRead", (data) => {
    markdownInput.value = data.fileContents;
    currentFile = data.currentFile;
    renderMarkdown();
    updateTitle();
    wordCount();
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
    aTags = markdownOutput.getElementsByTagName("a");
    for (var i = 0; i < aTags.length; i++) {
        aTags[i].setAttribute("onclick","openLink('" + aTags[i].href + "');");
        aTags[i].href = "#";
    }
    return false;
    wordCount();
    // console.log("Finished Markdown Rendering: " + new Date().getTime());
});

function openLink(url) {
    this.api.send("openLink", url);
}

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

function updateTitle() {
    if (openFsTree != undefined) {
        document.title = "Markright | " + openFsTree.name;
    } else if (currentFile != undefined) {
        document.title = "Markright | " + currentFile.name;
    } else {
        document.title = "Markright | No Open File Or Folder";
    }
}

this.api.receive("fileClose", () => {
    markdownInput.value = "No File Opened";
    currentFile = undefined;
    renderMarkdown();
    updateTitle();
    wordCount();
});

this.api.receive("closeFolder", () => {
    fsTreeOutput.innerHTML = "<span>No Directory Open</span>";
    fsTree = undefined;
    updateTitle();
});

this.api.receive("find", () => {
    if (findMenu.style.display == "none") {
        findMenu.style.display = "block";
        replaceSubMenu.style.display = "none";
        findInput.focus();
    } else {
        findMenu.style.display = "none";
        replaceSubMenu.style.display = "none";
    }
});

this.api.receive("replace", () => {
    if (replaceSubMenu.style.display == "none") {
        findMenu.style.display = "block";
        replaceSubMenu.style.display = "flex";
        replaceInput.focus();
    } else {
        findMenu.style.display = "none";
        replaceSubMenu.style.display = "none";
    }
});

function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function resetFind() {
    found = -1;
}

function findNext() {
    let indices = getIndicesOf(findInput.value, markdownInput.value, false);
    found++;
    if (found > indices.length) found = 0;
    index = indices[found];
    markdownInput.focus();
    markdownInput.selectionStart = index;
    markdownInput.selectionEnd = index + findInput.value.length;
}

function findPrev() {
    let indices = getIndicesOf(findInput.value, markdownInput.value, false);
    found--;
    if (found < 0) found = indices.length - 1;
    index = indices[found];
    markdownInput.focus();
    markdownInput.selectionStart = index;
    markdownInput.selectionEnd = index + findInput.value.length;
}

function replaceOne() {
    let findStr = findInput.value.toLowerCase();
    let replaceStr = replaceInput.value;
    if (findStr == "" || replaceStr == "") {
        return;
    }
    if (found < 0) found = 0;
    let indices = getIndicesOf(findInput.value, markdownInput.value, false);
    if (indices.length == 0) return;
    markdownInput.value = markdownInput.value.split("").toSpliced(indices[found], findStr.length, replaceStr).join("");
    renderMarkdown();
    markdownInput.focus();
    markdownInput.selectionStart = indices[found];
    markdownInput.selectionEnd = indices[found] + replaceStr.length;
    found--;
}

function replaceAll() {
    let findStr = findInput.value.toLowerCase();
    let replaceStr = replaceInput.value;
    if (findStr == "" || replaceStr == "") {
        return;
    }
    markdownInput.value = markdownInput.value.replace(new RegExp(findStr, "ig"), replaceStr);
    renderMarkdown();
}

this.api.send("openLast");
findMenu.style.display = "none";
replaceSubMenu.style.display = "none";
renderMarkdown();
wordCount();
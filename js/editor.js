this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.send("fileRead", "./Test.md");

this.api.receive("from_fileRead", (fileContents) => {
    markdownInput.value = fileContents;
    this.api.send("renderMarkdown", fileContents);
});

this.api.receive("save", () => {
    fileWrite();
});

function fileWrite() {
    //TODO: add trigger
    this.api.send("fileWrite", {
        file: "./Test.md",
        fileContents: markdownInput.value,
    });
}

this.api.receive("from_fileWrite", (fileContents) => {
    //TODO: add on page output
    alert("File Written.")
});

this.api.receive("from_renderMarkdown", (renderedMarkdown) => {
    markdownOutput.innerHTML = renderedMarkdown;
});

function renderMarkdown() {
    this.api.send("renderMarkdown", markdownInput.value);
}
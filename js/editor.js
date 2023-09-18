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
    alert("File Written.")
});

function renderMarkdown() {
    this.api.send("renderMarkdown", markdownInput.value);
    // console.log("Initiating Markdown Rendering: " + new Date().getTime());
}

this.api.receive("from_renderMarkdown", (renderedMarkdown) => {
    markdownOutput.innerHTML = renderedMarkdown;
    // console.log("Finished Markdown Rendering: " + new Date().getTime());
});
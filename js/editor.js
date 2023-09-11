this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.send("fileRead", "./Test.md");

this.api.receive("from_fileRead", (fileContents) => {
    this.api.send("renderMarkdown", fileContents);
});

this.api.receive("from_renderMarkdown", (renderedMarkdown) => {
    markdownOutput.innerHTML = renderedMarkdown;
});

this.api.receive("from_fileWrite", (fileContents) => {
    //TODO:
    alert("File Written.")
});
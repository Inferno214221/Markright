this.api.receive("throwError", (error) => {
    alert("An Error Occured: " + error);
});

this.api.send("startFileReading", "./Test.md");
this.api.receive("from_startFileReading", (fileContents) => {
    this.api.send("renderMarkdown", fileContents);
});

this.api.receive("from_renderMarkdown", (renderedMarkdown) => {
    markdownOutput.innerHTML = renderedMarkdown;
});
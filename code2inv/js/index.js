const editors = [1, 2, 3].map((i) => {
  const textarea = document.getElementById(`example-code-${i}`);
  return CodeMirror.fromTextArea(textarea, {
    mode: "text/x-csrc",
    lineNumbers: true,
    lineWrapping: true,
    autofocus: true,
    autoRefresh: true,
  });
});
const vscode = acquireVsCodeApi();
const chatBox = document.getElementById('chatBox');
const questionInput = document.getElementById('question');
const currentFileDisplay = document.getElementById('currentFile');

let currentCode = '';
let currentFilename = '';

function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.innerHTML += `<div class='q'>🙋‍♂️ Bạn: ${q}</div>`;
  chatBox.innerHTML += `<div class='q'>File ${currentFilename}</div>`;
  vscode.postMessage({ prompt: q, code: currentCode, filename: currentFilename });
  questionInput.value = "";
}

function formatReply(text) {
  return text
    .replace(/```(?:\w+)?\n?/g, "<pre><code>")
    .replace(/```/g, "</code></pre>")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

window.addEventListener('message', event => {
  const data = event.data;
  if (data.type === "update") {
    currentCode = data.code;
    currentFilename = data.fileName;
    currentFileDisplay.textContent = currentFilename;
  } else if (data.reply) {
    chatBox.innerHTML += `<div class='a'>🤖 AI: ${data.reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

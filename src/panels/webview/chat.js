const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");

let currentCode = "";
let currentFilename = "";
let selectedCode = "";
let selectionStart = 0;
let selectionEnd = 0;
let selectionStartCharacter = 0;
let selectionEndCharacter = 0;
function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.innerHTML += `<div class='q'>🙋‍♂️ Bạn: ${q}</div>`;
  chatBox.innerHTML += `<div class='fileAttach' id=${
    "fileAttach" +
    currentFilename +
    selectionStart +
    selectionEnd +
    selectionStartCharacter +
    selectionEndCharacter
  }>File ${
    selectedCode
      ? currentFilename + ` dòng ${selectionStart} - ${selectionEnd}  `
      : currentFilename
  }</div>`;
  const fileDiv = document.getElementById(
    "fileAttach" +
      currentFilename +
      selectionStart +
      selectionEnd +
      selectionStartCharacter +
      selectionEndCharacter
  );
  if (fileDiv) {
    fileDiv.onclick = () => {
      // Gửi message về extension để nhảy tới file/selection
      vscode.postMessage({
        type: "gotoSelection",
        fileName: currentFilename,
        selectionStart: selectionStart,
        selectionEnd: selectionStart,
        selectionStartCharacter: selectionStartCharacter,
        selectionEndCharacter: selectionEndCharacter,
      });
    };
  }

  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    code: currentCode,
    filename: currentFilename,
    selectedCode: selectedCode,
  });
  questionInput.value = "";
}
function extractCodeFromMarkdown(response) {
  // Tách phần code block nếu có
  const codeBlockRegex = /```(?:[\w-]*)?\n([\s\S]*?)```/gm;
  let formatted = response.replace(codeBlockRegex, (match, p1) => {
    return `<pre><code>${p1.trim()}</code></pre>`;
  });

  // Thay dấu * đầu dòng thành danh sách HTML
  if (formatted.includes("* ")) {
    formatted = formatted.replace(/\* (.+)/g, "<li>$1</li>");
    formatted = formatted.replace(/(<li>[\s\S]+<\/li>)/g, "<ul>$1</ul>");
  }

  // Loại bỏ dấu ``` còn dư
  formatted = formatted.replace(/```/g, "");

  return formatted.trim();
}

window.addEventListener("message", (event) => {
  const data = event.data;
  switch (data.type) {
    case "update":
      currentCode = data.code;
      currentFilename = data.fileName;
      selectedCode = data.selectedCode;
      selectionStart = data.selectionStart;
      selectionEnd = data.selectionEnd;
      selectionStartCharacter = data.selectionStartCharacter;
      selectionEndCharacter = data.selectionEndCharacter;
      if (!selectedCode)
        currentFileDisplay.textContent = currentFilename + " current";
      else
        currentFileDisplay.textContent = `${currentFilename}: dòng ${selectionStart} - ${selectionEnd}`;
      break;
    case "reply":
      chatBox.innerHTML += `<div class='robot'>🤖 AI: ${extractCodeFromMarkdown(
        data.reply
      )}</div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
      break;
  }
});

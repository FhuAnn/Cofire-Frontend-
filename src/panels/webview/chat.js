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
let attachedFiles = [];
function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.insertAdjacentHTML("beforeend", `<div class='q'>🙋‍♂️ Bạn: ${q}</div>`);
  let initialID =
    "fileAttach_" +
    (currentFilename || "") +
    "_" +
    selectionStart +
    "_" +
    selectionEnd +
    "_" +
    selectionStartCharacter +
    "_" +
    selectionEndCharacter +
    "_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 10000);
  chatBox.insertAdjacentHTML(
    "beforeend",
    `<div class='fileAttach' id=${initialID}>File ${
      selectedCode
        ? currentFilename + ` dòng ${selectionStart} - ${selectionEnd}  `
        : currentFilename
    }</div>`
  );
  const fileDiv = document.getElementById(initialID);
  if (fileDiv) {
    // Lưu lại giá trị tại thời điểm tạo nút
    const fileNameAtClick = currentFilename;
    const selectionStartAtClick = selectionStart;
    const selectionEndAtClick = selectionEnd;
    const selectionStartCharacterAtClick = selectionStartCharacter;
    const selectionEndCharacterAtClick = selectionEndCharacter;
    const relativePathAtClick = relativePath;

    fileDiv.onclick = () => {
      console.log("fileDiv clicked", relativePathAtClick);
      vscode.postMessage({
        type: "gotoSelection",
        fileName: fileNameAtClick,
        selectionStart: selectionStartAtClick,
        selectionEnd: selectionEndAtClick,
        selectionStartCharacter: selectionStartCharacterAtClick,
        selectionEndCharacter: selectionEndCharacterAtClick,
        relativePath: relativePathAtClick,
      });
    };
  }

  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    files: attachedFiles,
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
  console.log("Received message from extension:", data);
  switch (data.type) {
    case "update":
      currentCode = data.code;
      currentFilename = data.fileName;
      selectedCode = data.selectedCode;
      selectionStart = data.selectionStart;
      selectionEnd = data.selectionEnd;
      selectionStartCharacter = data.selectionStartCharacter;
      selectionEndCharacter = data.selectionEndCharacter;
      relativePath = data.relativePath;
      if (!selectedCode)
        currentFileDisplay.textContent = currentFilename + " current";
      else
        currentFileDisplay.textContent = `${currentFilename}: dòng ${selectionStart} - ${selectionEnd}`;
      break;
    case "reply":
      chatBox.insertAdjacentHTML(
        "beforeend",
        `<div class='robot'>🤖 AI: ${extractCodeFromMarkdown(data.reply)}</div>`
      );
      chatBox.scrollTop = chatBox.scrollHeight;
      break;
  }
});

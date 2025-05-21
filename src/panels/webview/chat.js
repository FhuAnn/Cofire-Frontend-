const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");

let currentCode = "";
let currentFilename = "";

function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.innerHTML += `<div class='q'>🙋‍♂️ Bạn: ${q}</div>`;
  chatBox.innerHTML += `<div class='fileAttach'>File ${currentFilename}</div>`;
  vscode.postMessage({
    prompt: q,
    code: currentCode,
    filename: currentFilename,
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
  if (data.type === "update") {
    currentCode = data.code;
    currentFilename = data.fileName;
    currentFileDisplay.textContent = currentFilename;
  } else if (data.reply) {
    chatBox.innerHTML += `<div class='robot'>🤖 AI: ${extractCodeFromMarkdown(
      data.reply
    )}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

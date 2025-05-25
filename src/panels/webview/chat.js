const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");
const attachedFilesDisplay = document.getElementById("fileInfo");
document.getElementById("attachFileBtn").onclick = function () {
  vscode.postMessage({ type: "attachFile" });
};

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
  //console.log("Received message from extension:", data);
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
      if (!selectedCode) currentFileDisplay.textContent = currentFilename;
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
    case "fileAttached": {
      if (attachedFiles.some((f) => f.relativePath === data.relativePath)) {
        return;
      }
      const fileObj = {
        fileName: data.fileName,
        relativePath: data.relativePath,
        content: data.content,
      };
      attachedFiles.push(fileObj);
      console.log("Attached files:", attachedFiles);
      // Tạo phần tử fileAttach
      const fileDiv = document.createElement("div");
      fileDiv.className = "fileAttach";
      fileDiv.title = data.fileName;

      const fileNameSpan = document.createElement("span");
      fileNameSpan.className = "fileName";
      fileNameSpan.textContent = `${data.fileName}`;
      fileDiv.appendChild(fileNameSpan);

      // Tạo nút remove
      const removeBtn = document.createElement("div");
      removeBtn.className = "remove";
      removeBtn.title = "Remove file";
      removeBtn.textContent = "X";

      // Gán sự kiện xoá
      removeBtn.onclick = () => {
        // Xoá khỏi mảng attachedFiles
        attachedFiles = attachedFiles.filter((f) => f !== fileObj);
        // Xoá khỏi giao diện
        attachedFilesDisplay.removeChild(fileDiv);
      };
      fileDiv.appendChild(removeBtn);
      attachedFilesDisplay.appendChild(fileDiv);
      // Focus vào input sau khi add file
      questionInput.focus();
      break;
    }
    case "selectionAttached": {
      // Kiểm tra trùng selection (dựa vào file + vị trí dòng)
      if (
        attachedFiles.some(
          (f) =>
            f.relativePath === data.relativePath &&
            f.selectionStart === data.selectionStart &&
            f.selectionEnd === data.selectionEnd
        )
      ) {
        // alert("Đoạn code này đã được đính kèm!");
        return;
      }
      //console.log("Selection attached:", data);
      const fileObj = {
        fileName: data.fileName,
        relativePath: data.relativePath,
        selectedCode: data.selectedCode,
        selectionStart: data.selectionStart,
        selectionEnd: data.selectionEnd,
        selectionStartCharacter: data.selectionStartCharacter,
        selectionEndCharacter: data.selectionEndCharacter,
        type: "selection",
      };
      attachedFiles.push(fileObj);

      // Hiển thị lên giao diện
      const fileDiv = document.createElement("div");
      fileDiv.className = "fileAttach";
      fileDiv.textContent = `${data.fileName}: dòng ${data.selectionStart} - ${data.selectionEnd}`;
      fileDiv.title = data.fileName;

      const fileNameSpan = document.createElement("span");
      fileNameSpan.className = "fileName";
      fileNameSpan.textContent = `${data.fileName} )`;
      fileDiv.appendChild(fileNameSpan);

      const removeBtn = document.createElement("div");
      removeBtn.className = "remove";
      removeBtn.title = "Remove selection";
      removeBtn.textContent = "X";
      removeBtn.onclick = () => {
        attachedFiles = attachedFiles.filter((f) => f !== fileObj);
        attachedFilesDisplay.removeChild(fileDiv);
      };
      fileDiv.appendChild(removeBtn);
      attachedFilesDisplay.appendChild(fileDiv);

      questionInput.focus();
      break;
    }
  }
});

questionInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
  }
});

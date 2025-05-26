const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");
const attachedFilesDisplay = document.getElementById("fileInfo");
document.getElementById("attachFileBtn").onclick = function () {
  vscode.postMessage({ type: "attachFile" });
};
const state = {
  currentFile: {
    code: "",
    fileName: "",
    selectedCode: "",
    selectionStart: 0,
    selectionEnd: 0,
    selectionStartCharacter: 0,
    selectionEndCharacter: 0,
    relativePath: "",
  },
  attachedFiles: [],
};

// Hàm gán sự kiện onClick cho file đính kèm (chuyển tới selection nếu có)
function addAttachFileOnClick(file) {
  console.log("Adding attach file on click:", file);
  let initialID =
    "fileAttach_" +
    (file.fileName || "") +
    "_" +
    (file.selectionStart || "") +
    "_" +
    (file.selectionEnd || "") +
    "_" +
    (file.selectionStartCharacter || "") +
    "_" +
    (file.selectionEndCharacter || "") +
    "_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 10000);
  chatBox.insertAdjacentHTML(
    "beforeend",
    `<div class='fileAttach' id=${initialID}>File ${
      file.selectedCode
        ? file.fileName +
          ` dòng ${file.selectionStart} - ${file.selectionEnd}  `
        : file.fileName
    }</div>`
  );
  const fileDiv = document.getElementById(initialID);
  if (fileDiv) {
    // // Lưu lại giá trị tại thời điểm tạo nút
    // const fileNameAtClick = file.fileName;
    // const selectionStartAtClick = file.selectionStart;
    // const selectionEndAtClick = file.selectionEnd;
    // const selectionStartCharacterAtClick = file.selectionStartCharacter;
    // const selectionEndCharacterAtClick = file.electionEndCharacter;
    // const relativePathAtClick = file.relativePath;

    fileDiv.onclick = () => {
      console.log("fileDiv clicked", relativePathAtClick);
      vscode.postMessage({
        type: "gotoSelection",
        fileName: file.fileName,
        selectionStart: file.selectionStart,
        selectionEnd: file.selectionEnd,
        selectionStartCharacter: file.selectionStartCharacter,
        selectionEndCharacter: file.electionEndCharacter,
        relativePath: file.relativePath,
      });
    };
  }
}

function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.insertAdjacentHTML("beforeend", `<div class='q'>🙋‍♂️ Bạn: ${q}</div>`);

  let filesToSend = [...state.attachedFiles];
  if (
    state.currentFile.fileName &&
    !filesToSend.some((f) => f.fileName === state.cu && !f.type)
  ) {
    filesToSend.push({
      fileName: state.currentFile.fileName,
      code: state.currentFile.code,
      relativePath:
        typeof state.currentFile.relativePath !== "undefined"
          ? state.currentFile.relativePath
          : "",
    });
  }
  filesToSend.map((file) => {
    addAttachFileOnClick(file);
  });
  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    files: filesToSend,
  });
  questionInput.value = "";
  state.attachedFiles = []; // Reset mảng attachedFiles sau khi gửi
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
      console.log("Update current file:", data);
      state.currentFile.code = data.code;
      state.currentFile.fileName = data.fileName;
      state.currentFile.selectedCode = data.selectedCode;
      state.currentFile.selectionStart = data.selectionStart;
      state.currentFile.selectionEnd = data.selectionEnd;
      state.currentFile.selectionStartCharacter = data.selectionStartCharacter;
      state.currentFile.selectionEndCharacter = data.selectionEndCharacter;
      state.currentFile.relativePath = data.relativePath;
      if (!state.currentFile.selectedCode)
        currentFileDisplay.textContent = state.currentFile.fileName;
      else
        currentFileDisplay.textContent = `${state.currentFile.fileName}: line ${state.currentFile.selectionStart} - ${state.currentFile.selectionEnd}`;
      break;
    case "reply":
      chatBox.insertAdjacentHTML(
        "beforeend",
        `<div class='robot'>🤖 AI: ${extractCodeFromMarkdown(data.reply)}</div>`
      );
      chatBox.scrollTop = chatBox.scrollHeight;
      break;
    case "fileAttached": {
      console.log("File attached:", data);
      if (
        state.attachedFiles.some((f) => f.relativePath === data.relativePath)
      ) {
        return;
      }
      const fileObj = {
        fileName: data.fileName,
        relativePath: data.relativePath,
        code: data.content,
      };
      state.attachedFiles.push(fileObj);
      //console.log("Attached files:", attachedFiles);
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
        state.attachedFiles = state.attachedFiles.filter((f) => f !== fileObj);
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
        state.attachedFiles.some(
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

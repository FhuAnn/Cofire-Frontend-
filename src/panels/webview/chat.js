// ====== Khai báo biến và DOM ======
const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");
const attachedFilesDisplay = document.getElementById("fileInfo");

// ====== State lưu trữ thông tin hiện tại ======
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
  isLoading: false,
  attachedFiles: [],
};

// ====== Sự kiện nút đính kèm file ======
document.getElementById("attachFileBtn").onclick = function () {
  vscode.postMessage({ type: "attachFile" });
};

// ====== Hàm thêm file đính kèm vào giao diện và gán sự kiện click ======
function addAttachFileOnClick(file, containerId) {
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

  const fileDiv = document.createElement("div");
  fileDiv.className = "fileAttach";
  fileDiv.id = initialID;
  fileDiv.textContent = file.selectedCode
    ? `${file.fileName}: dòng ${file.selectionStart} - ${file.selectionEnd}`
    : file.fileName;

  // Khi click vào file đính kèm sẽ gửi thông tin selection về extension
  fileDiv.onclick = () => {
    vscode.postMessage({
      type: "gotoSelection",
      fileName: file.fileName,
      selectionStart: file.selectionStart,
      selectionEnd: file.selectionEnd,
      selectionStartCharacter: file.selectionStartCharacter,
      selectionEndCharacter: file.selectionEndCharacter,
      relativePath: file.relativePath,
    });
  };

  const parent = document.querySelector(`#${containerId} .attachedFiles`);
  if (parent) {
    parent.appendChild(fileDiv);
  }
}

// ====== Hàm gửi câu hỏi lên extension ======
function send() {
  const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const q = questionInput.value;
  if (!q) {
    return;
  }

  // Hiển thị câu hỏi lên chatBox
  chatBox.insertAdjacentHTML(
    "beforeend",
    `
  <div class="messageBlock" id="${messageId}" tabindex="0">
    <div class="q">
    🙋‍♂️ Bạn:<br>
     ${q}
     </div>
    <div class="attachedFiles"></div>
  </div>`
  );

  // Hiển thị block AI loading
  const loadingId = `ai_loading_${Date.now()}`;
  chatBox.insertAdjacentHTML(
    "beforeend",
    `
    <div class="messageBlock ai" id="${loadingId}" tabindex="0">
      <div class="robot">🤖 AI: <i>đang xử lý...</i></div>
    </div>
  `
  );

  // Chuẩn bị danh sách file gửi lên extension
  let filesToSend = [...state.attachedFiles];
  if (
    state.currentFile.fileName &&
    !filesToSend.some(
      (f) => f.fileName === state.currentFile.fileName && !f.type
    )
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
  // Hiển thị file đính kèm lên giao diện
  filesToSend.map((file) => {
    addAttachFileOnClick(file, messageId);
  });

  // Gửi prompt và file lên extension
  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    files: filesToSend,
  });

  // Reset input và danh sách file đính kèm
  questionInput.value = "";
  state.attachedFiles = [];
}

// ====== Lắng nghe message từ extension gửi về ======
window.addEventListener("message", (event) => {
  const data = event.data;
  console.log("Received message from extension:", data);
  switch (data.type) {
    // Cập nhật thông tin file hiện tại
    case "update":
      state.currentFile.code = data.code;
      state.currentFile.fileName = data.fileName;
      state.currentFile.selectedCode = data.selectedCode;
      state.currentFile.selectionStart = data.selectionStart;
      state.currentFile.selectionEnd = data.selectionEnd;
      state.currentFile.selectionStartCharacter = data.selectionStartCharacter;
      state.currentFile.selectionEndCharacter = data.selectionEndCharacter;
      state.currentFile.relativePath = data.relativePath;
      if (!state.currentFile.selectedCode) {
        currentFileDisplay.textContent = state.currentFile.fileName;
      } else {
        currentFileDisplay.textContent = `${state.currentFile.fileName}: line ${state.currentFile.selectionStart} - ${state.currentFile.selectionEnd}`;
      }
      break;

    // Nhận phản hồi từ AI và hiển thị lên chatBox
    case "reply":
      const htmlContent = marked.parse(data.reply);
      const aiBlock = document.getElementById(data.messageId);
      if (aiBlock) {
        aiBlock.innerHTML = `<div class='robot'>🤖 AI:
      <div class="markdown-content">${htmlContent}</div>
    </div>`;
      }
      addCopyButtonsToCodeBlocks();
      chatBox.scrollTop = chatBox.scrollHeight;
      break;

    // Khi file được đính kèm (toàn bộ file)
    case "fileAttached": {
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

      // Hiển thị file đính kèm lên giao diện
      const fileDiv = document.createElement("div");
      fileDiv.className = "fileAttach";
      fileDiv.title = data.fileName;

      const fileNameSpan = document.createElement("span");
      fileNameSpan.className = "fileName";
      fileNameSpan.textContent = `${data.fileName}`;
      fileDiv.appendChild(fileNameSpan);

      // Nút xoá file đính kèm
      const removeBtn = document.createElement("div");
      removeBtn.className = "remove";
      removeBtn.title = "Remove file";
      removeBtn.textContent = "X";
      removeBtn.onclick = () => {
        state.attachedFiles = state.attachedFiles.filter((f) => f !== fileObj);
        attachedFilesDisplay.removeChild(fileDiv);
      };
      fileDiv.appendChild(removeBtn);
      attachedFilesDisplay.appendChild(fileDiv);

      // Focus lại vào input
      questionInput.focus();
      break;
    }

    // Khi đính kèm đoạn selection trong file
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
        return;
      }
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

      // Nút xoá selection
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

// ====== Sự kiện Enter để gửi câu hỏi ======
questionInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
  }
});

// insert copy vào pre

function addCopyButtonsToCodeBlocks() {
  const container = document.querySelector('.markdown-content');
  if (!container) {return;}

  // Xóa nút copy cũ (nếu có)
  container.querySelectorAll('.copy-btn').forEach(btn => btn.remove());

  container.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) {return;}

    // Tạo nút
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.innerText = '📋 Copy';

    // Xử lý sự kiện copy
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        button.innerText = '✅ Copied!';
        setTimeout(() => (button.innerText = '📋 Copy'), 2000);
      });
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });
}
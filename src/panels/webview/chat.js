// ====== Khai báo biến và DOM ======
const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const currentFileDisplay = document.getElementById("currentFile");
const attachedFilesDisplay = document.getElementById("addFiles");
const dropZone = document.getElementById("dropZone");

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
    (file.fileName || file.folderName || "") +
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
  const div = document.createElement("div");
  div.className = "fileAttach";
  div.id = initialID;

  let content = "File ";
  if (file.selectedCode) {
    content += `${file.fileName} line ${file.selectionStart} - ${file.selectionEnd}`;
  } else {
    content += file.fileName || "[Folder]" + file.folderName;
  }

  div.textContent = content + " ";

  // Gán onclick trực tiếp cho div vừa tạo
  const nameAtClick = file.fileName ? file.fileName : file.folderName;
  const selectionStartAtClick = file.selectionStart;
  const selectionEndAtClick = file.selectionEnd;
  const selectionStartCharacterAtClick = file.selectionStartCharacter;
  const selectionEndCharacterAtClick = file.selectionEndCharacter;
  const relativePathAtClick = file.relativePath;
  div.onclick = () => {
    vscode.postMessage({
      type: "gotoSelection",
      typeAttached: file.type,
      name: nameAtClick,
      selectionStart: selectionStartAtClick,
      selectionEnd: selectionEndAtClick,
      selectionStartCharacter: selectionStartCharacterAtClick,
      selectionEndCharacter: selectionEndCharacterAtClick,
      relativePath: relativePathAtClick,
      folderUri: file.folderUri || undefined,
    });
  };

  const parent = document.querySelector(`#${containerId} .attachedFiles`);
  if (parent) {
    parent.appendChild(div);
  }
}

// ====== Hàm gửi câu hỏi lên extension ======
function send() {
  const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const q = questionInput.value;
  if (!q) {
    return;
  }
  const userBlock = document.createElement("div");
  userBlock.className = "messageBlock";
  userBlock.id = messageId;
  userBlock.tabIndex = 0;
  userBlock.innerHTML = `
  <div class="q">
    🙋‍♂️ Bạn:
    <br><br>
    ${q}
  </div>
  <div class="attachedFiles"></div>
`;

  chatBox.appendChild(userBlock);

  const loadingId = `ai_loading_${Date.now()}`;
  const aiBlock = document.createElement("div");
  aiBlock.className = "messageBlock ai";
  aiBlock.id = loadingId;
  aiBlock.tabIndex = 0;
  aiBlock.innerHTML = `
  <div class="robot loading">🤖 AI: <i>đang xử lý...</i></div>
`;
  chatBox.appendChild(aiBlock);

  chatBox.scrollTop = chatBox.scrollHeight;

  let filesToSend = [];
  console.log("Current files:", state.currentFile);
  if (
    state.currentFile &&
    !filesToSend.some(
      (f) =>
        f.relativePath === state.currentFile.relativePath &&
        !f.type &&
        (f.type !== "selection" ||
          f.selectedCode === state.currentFile.selectedCode)
    )
  ) {
    filesToSend.push({
      fileName: state.currentFile.fileName,
      code: state.currentFile.code,
      relativePath: state.currentFile.relativePath,
    });
  }
  console.log("This is not current file:");

  filesToSend = [...filesToSend, ...state.attachedFiles];
  filesToSend.map((file) => {
    addAttachFileOnClick(file, messageId);
  });

  // Gửi prompt và file lên extension
  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    files: filesToSend,
    loadingId,
  });

  // Reset input và danh sách file đính kèm
  questionInput.value = "";
  state.attachedFiles = [];
  // Xóa UI fileAttach
  attachedFilesDisplay.innerHTML = "";
}

window.addEventListener("message", (event) => {
  const data = event.data;
  //console.log("Received message from extension:", data);
  switch (data.type) {
    // Cập nhật thông tin file hiện tại
    case "update":
      console.log("Relative path file:", data.relativePath);
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
      const aiBlock = document.getElementById(data.loadingId);
      if (!aiBlock) {
        return;
      }
      const robotDiv = aiBlock.querySelector(".robot");
      if (!robotDiv) {
        return;
      }
      robotDiv.classList.remove("loading");

      robotDiv.innerHTML = `🤖 AI:
      <div class="markdown-content">${htmlContent}</div>
    `;
      chatBox.scrollTop = chatBox.scrollHeight;
      break;

    // Khi file được đính kèm (toàn bộ file)
    case "fileAttached": {
      //console.log("File attached:", data);
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
      console.log("Selection attached:", state.attachedFiles);
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
      state.attachedFiles.push(fileObj);

      // Hiển thị lên giao diện
      const fileDiv = document.createElement("div");
      fileDiv.className = "fileAttach";
      fileDiv.textContent = `${data.fileName}: line ${data.selectionStart} - ${data.selectionEnd}`;
      fileDiv.title = data.fileName;

      const fileNameSpan = document.createElement("span");
      fileNameSpan.className = "fileName";
      fileNameSpan.textContent = `${data.fileName}`;
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
    case "folderAttached": {
      console.log("Folder attached:", data);
      // Kiểm tra trùng folder
      if (
        state.attachedFiles.some(
          (f) => f.relativePath === data.relativePath && f.type === "folder"
        )
      ) {
        return;
      }
      // console.log("Folder attached:", data);
      const folderObj = {
        folderName: data.folderName,
        relativePath: data.relativePath,
        folderUri: data.folderUri,
        type: "folder",
      };
      state.attachedFiles.push(folderObj);

      // Xoá các phần tử fileAttach cũ nếu có
      // Hiển thị lên giao diện
      const folderDiv = document.createElement("div");
      folderDiv.className = "fileAttach";
      folderDiv.textContent = `[Folder] ${data.folderName}`;
      folderDiv.title = data.folderName;

      const removeBtn = document.createElement("div");
      removeBtn.className = "remove";
      removeBtn.title = "Remove folder";
      removeBtn.textContent = "X";
      removeBtn.onclick = () => {
        state.attachedFiles = state.attachedFiles.filter(
          (f) => f !== folderObj
        );
        attachedFilesDisplay.removeChild(folderDiv);
      };
      folderDiv.appendChild(removeBtn);
      attachedFilesDisplay.appendChild(folderDiv);

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
    updateEmptyText();
  }
});

// dropzone
let dragCounter = 0;

window.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragCounter++;
  dropZone.classList.add("active");
  //console.log("dragenter", dragCounter, dropZone);
});
window.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.classList.remove("active");
  }
  //console.log("dragleave", dragCounter, dropZone);
});
window.addEventListener("dragover", (e) => {
  e.preventDefault();
});
window.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.classList.remove("active");
  const uriList = e.dataTransfer.getData("text/uri-list");
  console.log("Dropped URIs:", uriList);
  if (uriList) {
    const uris = uriList
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (uris.length > 0) {
      vscode.postMessage({
        type: "filesDropped",
        uris: uris,
      });
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      send();
      updateEmptyText();
    });
  }
});


function updateEmptyText() {
  const chatBox = document.getElementById("chatBox");
  const emptyText = document.getElementById("emptyText");

  if (chatBox.children.length === 1) {
    emptyText.style.display = "block";
  } else {
    emptyText.style.display = "none";
  }
}

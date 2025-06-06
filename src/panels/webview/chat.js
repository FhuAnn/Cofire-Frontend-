// ====== Khai báo biến và DOM ======

const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const micBtn = document.getElementById("micBtn");
const currentFileDisplay = document.getElementById("currentFile");
const toggleBtn = document.getElementById("toggleVisibilityBtn");

const currentFileCard = document.getElementById("currentFileCard");
const attachedFilesDisplay = document.getElementById("addFiles");
const dropZone = document.getElementById("dropZone");

marked.setOptions({
  langPrefix: "hljs language-", // class cho code block
});
let isInVisible = false;

// Tạo renderer tùy chỉnh
const renderer = new marked.Renderer();

renderer.code = (code, infostring) => {
  const lang = (infostring || "").toLowerCase();
  const language = lang || hljs.highlightAuto(code).language || "plaintext";
  const highlightedCode = hljs.highlight(code, { language }).value;

  const langLabel =
    language !== "plaintext" ? `<div class="lang-label">${language}</div>` : "";

  const copyBtn = `<button class="copy-btn" aria-label="Sao chép code" title="Sao chép code">Sao chép</button>`;

  return `
    <div class="code-wrapper">
      <pre class="hljs language-${language}">
        <code>${highlightedCode}</code>
      </pre>
        ${langLabel}
        ${copyBtn}
    </div>
  `;
};

// Hàm render markdown
function renderMarkdown(mdText, container) {
  if (!container) return;

  container.innerHTML = marked.parse(mdText, { renderer });

  container.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".code-wrapper");
      const codeEl = wrapper?.querySelector("code");
      if (!codeEl) return;

      navigator.clipboard
        .writeText(codeEl.innerText)
        .then(() => {
          btn.textContent = "Đã sao chép!";
          setTimeout(() => (btn.textContent = "Sao chép"), 1500);
        })
        .catch(() => {
          btn.textContent = "Lỗi!";
          setTimeout(() => (btn.textContent = "Sao chép"), 1500);
        });
    });
  });
}
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
  isLoading: false,
  attachedFiles: [],
};

// ====== Sự kiện nút đính kèm file ======
document.getElementById("attachFileBtn").onclick = function () {
  vscode.postMessage({ type: "attachFile" });
};

// icon map
const iconMap = {
  angular: "angular.svg",
  cpp: "cpp.svg",
  cs: "cs.svg",
  css: "css.svg",
  docker: "docker.svg",
  folder: "folder.svg",
  go: "go.svg",
  html: "html.svg",
  java: "java.svg",
  js: "js.svg",
  npm: "npm.svg",
  php: "php.svg",
  python: "python.svg",
  rb: "ruby.svg",
  ts: "ts.svg",
  tsx: "tsx.svg",
  vue: "vue.svg",
  default: "default.svg",
  json: "json.svg",
};
const iconBase = document.body.getAttribute("data-icon-base");

function getIconForFile(filename) {
  const ext = filename.split(".").pop().toLowerCase();

  // Nếu là thư mục
  if (!filename.includes(".")) {
    return `${iconBase}/${["folder"]}`;
  }

  return `${iconBase}/${iconMap[ext] || iconMap["default"]}`;
}

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

  let content = "";
  if (file.selectedCode) {
    content = `${file.fileName} line ${file.selectionStart} - ${file.selectionEnd}`;
  } else {
    content = file.fileName || file.folderName;
  }

  console.log("Adding file:", file, file.fileName);
  // Get icon based on file or folder name
  const iconSrc = getIconForFile(file.fileName || file.folderName);
  const iconImg = document.createElement("img");
  iconImg.src = iconSrc;
  iconImg.className = "file-icon";
  iconImg.style.width = "16px"; // Adjust size as needed
  iconImg.style.marginRight = "5px"; // Space between icon and text
  div.appendChild(iconImg);

  const textSpan = document.createElement("span");
  textSpan.textContent = content + " ";
  div.appendChild(textSpan);

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

  //??????const parent = document.querySelector(`#${containerId} .attachedFiles`);
  const parent = document.getElementById(containerId);
  if (parent) {
    console.log("Found parent element:", parent);
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
    state.currentFile.relativePath &&
    !isInVisible &&
    !filesToSend.some(
      (f) =>
        f.relativePath === state.currentFile.relativePath &&
        !f.type &&
        (f.type !== "selection" ||
          f.selectedCode === state.currentFile.selectedCode)
    )
  ) {
    filesToSend.push({
      fileName: state.currentFile.fileName + " current",
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
      if (!data.relativePath) {
        currentFileCard.style.display = "none";
        return;
      } else currentFileCard.style.display = "flex";
      console.log("Relative path file:", data.relativePath);
      state.currentFile.code = data.code;
      state.currentFile.fileName = data.fileName;
      state.currentFile.selectedCode = data.selectedCode;
      state.currentFile.selectionStart = data.selectionStart;
      state.currentFile.selectionEnd = data.selectionEnd;
      state.currentFile.selectionStartCharacter = data.selectionStartCharacter;
      state.currentFile.selectionEndCharacter = data.selectionEndCharacter;
      state.currentFile.relativePath = data.relativePath;
      // Clear current content
      currentFileDisplay.innerHTML = "";

      // Create icon element
      const iconSrc = getIconForFile(state.currentFile.fileName);
      const iconImg = document.createElement("img");
      iconImg.src = iconSrc;
      iconImg.className = "file-icon";
      iconImg.style.width = "16px";
      iconImg.style.marginRight = "5px";
      currentFileDisplay.appendChild(iconImg);

      // Create text span
      const textSpan = document.createElement("span");
      if (!state.currentFile.selectedCode) {
        textSpan.textContent = state.currentFile.fileName;
      } else {
        textSpan.textContent = `${state.currentFile.fileName}: line ${state.currentFile.selectionStart} - ${state.currentFile.selectionEnd} `;
      }
      textSpan.textContent += " current";
      currentFileDisplay.appendChild(textSpan);
      break;

    // Nhận phản hồi từ AI và hiển thị lên chatBox
    case "reply":
      const htmlContent = marked.parse(data.reply, { renderer });
      console.log(htmlContent);
      const aiBlock = document.getElementById(data.loadingId);
      if (!aiBlock) {
        return;
      }
      console.log(aiBlock);
      const robotDiv = aiBlock.querySelector(".robot");
      if (!robotDiv) {
        console.log("Robot div not found in AI block");
        return;
      }
      console.log("Robot div found:", robotDiv);
      robotDiv.classList.remove("loading");

      // Tạo div markdown-content mới
      const mdContainer = document.createElement("div");
      mdContainer.className = "markdown-content";

      // Render markdown vào div này
      renderMarkdown(data.reply, mdContainer);

      // Gán innerHTML cho robotDiv với phần header + markdown-content
      robotDiv.innerHTML = `🤖 AI:`;
      robotDiv.appendChild(mdContainer);

      chatBox.scrollTop = chatBox.scrollHeight;
      break;

    // Khi file được đính kèm (toàn bộ file)
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

      // Hiển thị file đính kèm lên giao diện
      const fileDiv = document.createElement("div");
      fileDiv.className = "fileAttach";
      fileDiv.title = data.fileName;
      // Add icon
      const iconSrc = getIconForFile(data.fileName);
      const iconImg = document.createElement("img");
      iconImg.src = iconSrc;
      iconImg.className = "file-icon";
      iconImg.style.width = "16px";
      iconImg.style.marginRight = "5px";
      fileDiv.appendChild(iconImg);
      console.log("successfully Add icon");

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

      // Add icon
      const iconSrc = getIconForFile(data.fileName);
      const iconImg = document.createElement("img");
      iconImg.src = iconSrc;
      iconImg.className = "file-icon";
      iconImg.style.width = "16px";
      iconImg.style.marginRight = "5px";
      fileDiv.appendChild(iconImg);

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
      folderDiv.title = data.folderName;

      // Add icon
      const iconSrc = getIconForFile(data.folderName);
      const iconImg = document.createElement("img");
      iconImg.src = iconSrc;
      iconImg.className = "file-icon";
      iconImg.style.width = "16px";
      iconImg.style.marginRight = "5px";
      folderDiv.appendChild(iconImg);

      const folderNameSpan = document.createElement("span");
      folderNameSpan.className = "fileName";
      folderNameSpan.textContent = `${data.folderName}`;
      folderDiv.appendChild(folderNameSpan);

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

toggleBtn.addEventListener("click", () => {
  isInVisible = !isInVisible;
  toggleBtn.textContent = isInVisible ? "🙈" : "👁️";
  isInVisible
    ? currentFile.classList.add("textLineThough")
    : currentFile.classList.remove("textLineThough");
});

// model selection

function toggleDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.classList.toggle("show");
  console.log("Toggle dropdown");
}

function selectModel(label) {
  const items = document.querySelectorAll(".dropdown-item");
  items.forEach((item) => item.classList.remove("selected"));

  const selectedItem = Array.from(items).find(
    (item) => item.getAttribute("data-label") === label
  );
  if (selectedItem) {
    selectedItem.classList.add("selected");
    console.log("Selected item:", selectedItem.getAttribute("data-label"));
  } else {
    console.log("Item not found for label:", label);
  }

  const selectedModel = document.getElementById("selectedModel");
  selectedModel.textContent = label;

  const dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.classList.remove("show");
}

window.onclick = function (event) {
  if (!event.target.closest(".dropdown")) {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu.classList.contains("show")) {
      dropdownMenu.classList.remove("show");
      console.log("Closed dropdown");
    }
  }
};

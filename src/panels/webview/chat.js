const vscode = acquireVsCodeApi();
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const micBtn = document.getElementById("micBtn");
const currentFileDisplay = document.getElementById("currentFile");
const currentFileCard = document.getElementById("currentFileCard");
const attachedFilesDisplay = document.getElementById("addFiles");
const dropZone = document.getElementById("dropZone");
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
  chatBox.insertAdjacentHTML(
    "beforeend",
    `<div class='fileAttach' id=${initialID}>File ${
      file.selectedCode
        ? file.fileName +
          ` line ${file.selectionStart} - ${file.selectionEnd}  `
        : (file.fileName || "[Folder]" + file.folderName) + " "
    }</div>`
  );
  const fileDiv = document.getElementById(initialID);
  if (fileDiv) {
    // Lưu lại giá trị tại thời điểm tạo nút
    const nameAtClick = file.fileName ? file.fileName : file.folderName;
    const selectionStartAtClick = file.selectionStart;
    const selectionEndAtClick = file.selectionEnd;
    const selectionStartCharacterAtClick = file.selectionStartCharacter;
    const selectionEndCharacterAtClick = file.selectionEndCharacter;
    const relativePathAtClick = file.relativePath;
    fileDiv.onclick = () => {
      //console.log("fileDiv clicked", relativePathAtClick);
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
  }
}

function send() {
  const q = questionInput.value;
  if (!q) return;
  chatBox.insertAdjacentHTML("beforeend", `<div class='q'>🙋‍♂️You : ${q}</div>`);

  let filesToSend = [];
  console.log("Current files:", state.currentFile);
  if (
    state.currentFile.relativePath &&
    !filesToSend.some(
      (f) =>
        f.relativePath === state.currentFile.relativePath &&
        !f.type &&
        (f.type !== "selection" ||
          f.selectedCode === state.currentFile.selectedCode)
    )
  ) {
    console.log("Current file is not in filesToSend", state.currentFile);
    filesToSend.push({
      fileName: state.currentFile.fileName,
      code: state.currentFile.code,
      relativePath: state.currentFile.relativePath,
    });
  }
  console.log("Thí is not current file:");

  filesToSend = [...filesToSend, ...state.attachedFiles];
  filesToSend.map((file) => {
    addAttachFileOnClick(file);
  });
  vscode.postMessage({
    type: "sendPromptToModel",
    prompt: q,
    files: filesToSend,
  });
  questionInput.value = "";
  state.attachedFiles = [];
  // Xóa UI fileAttach
  attachedFilesDisplay.innerHTML = "";
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

questionInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
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

// ====== Message Handler ======

import { MESSAGE_TYPES, MODELS } from "./constants.js";
import { stateManager } from "./stateManager.js";
import { UIComponents } from "./uiComponents.js";
import { markdownRenderer } from "./markdownRenderer.js";
import { revealHtmlBlocksGradually, scrollToBottom } from "./utils.js";
let pollingInterval;
function startLoginPolling(vscode) {
  // Gửi message "fetchLoginStatus" mỗi 3 giây
  pollingInterval = setInterval(() => {
    vscode.postMessage({ type: "fetchLoginStatus" });
  }, 3000);
}

export class MessageHandler {
  constructor(vscode) {
    this.vscode = vscode;
    this.uiComponents = new UIComponents(vscode);
  }

  handleMessage(data) {
    switch (data.type) {
      case MESSAGE_TYPES.UPDATE:
        this.handleUpdate(data);
        break;
      case MESSAGE_TYPES.REPLY:
        this.handleReply(data);
        break;
      case MESSAGE_TYPES.FILE_ATTACHED:
        this.handleFileAttached(data);
        break;
      case MESSAGE_TYPES.SELECTION_ATTACHED:
        this.handleSelectionAttached(data);
        break;
      case MESSAGE_TYPES.FOLDER_ATTACHED:
        this.handleFolderAttached(data);
        break;
      case MESSAGE_TYPES.NEW_MODEL_SELECTED:
        this.handleNewModelSelected(data);
        break;
      case MESSAGE_TYPES.ERROR:
        this.handleErrorCallAPI(data);
        break;
      case MESSAGE_TYPES.SHOW_CONVERSATION:
        this.handleShowConversation(data);
        break;
      case MESSAGE_TYPES.DELETE_CONVERSATION:
        this.handleDelete();
        break;
      case MESSAGE_TYPES.NOT_LOGGED_IN_YET:
        this.handleNotLoggedInYet(data);
        break;
      case MESSAGE_TYPES.LOGIN_SUCCESS:
        this.handleLoginSuccess(data);
        break;
      case MESSAGE_TYPES.SHOW_LOGIN_PROCESS:
        this.handleShowLoginProcess();
        break;
      case MESSAGE_TYPES.CANCEL_LOGIC_PROCESS:
        this.handleCancelLoginProcess();
        break;
    }
  }

  handleUpdate(data) {
    stateManager.updateCurrentFile(data);
    this.uiComponents.updateCurrentFileDisplay(
      stateManager.getCurrentFile(),
      stateManager.isInVisible()
    );
  }

  handleReply(data) {
    const aiBlock = document.getElementById(data.loadingId);
    if (!aiBlock) return;

    const robotDiv = aiBlock.querySelector(".robot");
    if (!robotDiv) return;

    robotDiv.classList.remove("loading");

    const mdContainer = document.createElement("div");
    mdContainer.className = "markdown-content";

    const tempContainer = document.createElement("div");
    markdownRenderer.renderMarkdown(data.reply, tempContainer);

    robotDiv.innerHTML = `🤖 ${stateManager.getSelectedModel()}:`;
    robotDiv.appendChild(mdContainer);

    revealHtmlBlocksGradually(tempContainer, mdContainer, this.vscode, 100);
    setTimeout(() => {
      const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
      const haveANewMessageBtn = document.getElementById("haveANewMessageBtn");
      const chatBox = document.getElementById("chatBox");
      if (!chatBox && !scrollToBottomBtn && !haveANewMessageBtn) return;
      const isAtBottom =
        chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 2;
      scrollToBottomBtn.disabled = isAtBottom;
      haveANewMessageBtn.style.display = isAtBottom ? "none" : "block";
    }, 1000);
  }

  handleFileAttached(data) {
    const fileObj = {
      fileName: data.fileName,
      relativePath: data.relativePath,
      code: data.content,
    };

    // Check if file already exists

    if (!stateManager.addAttachedFile(fileObj)) {
      this.uiComponents.showNotification(
        `File ${data.fileName} đã được đính kèm trước đó`,
        "warning"
      );
      return; // File already exists
    }

    const attachedFilesDisplay = document.getElementById("addFiles");
    const { fileDiv, removeBtn } =
      this.uiComponents.createAttachedFileElement(data);

    // Add remove functionality
    removeBtn.onclick = () => {
      stateManager.removeAttachedFile(fileObj);
      attachedFilesDisplay.removeChild(fileDiv);
    };

    fileDiv.appendChild(removeBtn);
    attachedFilesDisplay.appendChild(fileDiv);

    // Focus input
    document.getElementById("question").focus();
  }

  handleSelectionAttached(data) {
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

    if (!stateManager.addAttachedFile(fileObj)) {
      this.uiComponents.showNotification(
        `Selection từ ${data.fileName} đã được đính kèm trước đó`,
        "warning"
      );
      return; // Selection already exists
    }

    const attachedFilesDisplay = document.getElementById("addFiles");
    const { fileDiv, removeBtn } = this.uiComponents.createAttachedFileElement(
      data,
      "selection"
    );

    // Add remove functionality
    removeBtn.onclick = () => {
      stateManager.removeAttachedFile(fileObj);
      attachedFilesDisplay.removeChild(fileDiv);
    };

    fileDiv.appendChild(removeBtn);
    attachedFilesDisplay.appendChild(fileDiv);

    // Focus input
    document.getElementById("question").focus();
  }

  handleFolderAttached(data) {
    const folderObj = {
      folderName: data.folderName,
      relativePath: data.relativePath,
      folderUri: data.folderUri,
      type: "folder",
    };

    if (!stateManager.addAttachedFile(folderObj)) {
      this.uiComponents.showNotification(
        `Folder ${data.folderName} đã được đính kèm trước đó`,
        "warning"
      );
      return; // Folder already exists
    }

    const attachedFilesDisplay = document.getElementById("addFiles");
    const { fileDiv, removeBtn } = this.uiComponents.createAttachedFileElement(
      data,
      "folder"
    );

    // Add remove functionality
    removeBtn.onclick = () => {
      stateManager.removeAttachedFile(folderObj);
      attachedFilesDisplay.removeChild(fileDiv);
    };

    fileDiv.appendChild(removeBtn);
    attachedFilesDisplay.appendChild(fileDiv);

    // Focus input
    document.getElementById("question").focus();
  }

  handleNewModelSelected(data) {
    const otherModels = document.getElementById("dropdown-other");
    if (otherModels) {
      otherModels.style.display = "flex";
    }

    const { label, value } = data.modelData;

    // kiểm tra xem đã có chưa
    const existingModel = document.querySelector(
      `.dropdown-item.user-model[data-label="${value}"]`
    );

    if (!existingModel) {
      const newModelDiv = document.createElement("div");
      newModelDiv.className = "dropdown-item user-model";
      newModelDiv.setAttribute("data-label", value);
      newModelDiv.textContent = label;

      console.log("newModelDiv:", newModelDiv);

      otherModels.insertAdjacentElement("afterend", newModelDiv);
    } else {
      console.log(`Model "${value}" đã tồn tại, không thêm lại.`);
    }
  }

  handleErrorCallAPI(data) {
    const { message, file, stack, loadingId } = data;
    // Cập nhật khối AI nếu có loadingId
    if (loadingId) {
      const aiBlock = document.getElementById(loadingId);
      if (aiBlock) {
        const robotDiv = aiBlock.querySelector(".robot");
        if (robotDiv) {
          robotDiv.classList.remove("loading");
          robotDiv.innerHTML = `🤖 ${stateManager.getSelectedModel()}: <span class="error">${
            message || "Unknown error"
          }</span>`;
          scrollToBottom(document.getElementById("chatBox"));
        }
      }
    }
    // Ghi log chi tiết để debug
    console.error(
      `Backend error${file ? ` in ${file}` : ""}: ${message}`,
      stack || ""
    );
  }

  handleShowConversation(data) {
    const { messagesInConversation: messages, conversationId } = data;
    // Xóa nội dung chat cũ (nếu muốn)
    const chatBox = document.getElementById("chatBox");
    this.uiComponents.resetChatBox();
    sessionStorage.setItem("conversationId", conversationId);
    // Render từng message
    messages.forEach((msg) => {
      if (msg.role === "user") {
        const userBlock = this.uiComponents.createUserMessage(
          msg._id,
          msg.content
        );
        chatBox.appendChild(userBlock);
        msg.attaches.forEach((file) => {
          const fileElement = this.uiComponents.createFileAttachElement(
            file,
            msg._id
          );
          const parent = document.getElementById(msg._id);
          if (parent) {
            parent.appendChild(fileElement);
          }
        });
      } else {
        const aiBlock = this.uiComponents.createAIMessage(
          msg.id,
          msg.content,
          msg.model,
          msg.timestamp
        );
        chatBox.appendChild(aiBlock);
      }
    });
    // Cuộn xuống cuối
    this.uiComponents.updateEmptyText();
    setTimeout(() => {
      scrollToBottom(chatBox);
    }, 0);
  }

  handleDelete() {
    this.uiComponents.resetChatBox();
  }

  handleShowLoginProcess() {
    startLoginPolling(this.vscode);
    //Hiển thị giao diện đang chờ đăng nhập ở OAuth
    this.uiComponents.showLoginProcess();
  }

  handleLoginSuccess() {
    // Dừng việc polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    // Cập nhật trạng thái đăng nhập
    this.uiComponents.showWorkSpace();
  }

  handleNotLoggedInYet() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  handleCancelLoginProcess() {
    // Dừng việc polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    this.uiComponents.showLoginModal();
    // Hiển thị thông báo hủy quá trình đăng nhập
    this.uiComponents.showNotification("Đã hủy quá trình đăng nhập", "info");
  }
}

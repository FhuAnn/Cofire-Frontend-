// ====== Message Handler ======

import { MESSAGE_TYPES } from "./constants.js";
import { stateManager } from "./stateManager.js";
import { UIComponents } from "./uiComponents.js";
import { markdownRenderer } from "./markdownRenderer.js";
import { revealHtmlBlocksGradually, scrollToBottom } from "./utils.js";

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

    const chatBox = document.getElementById("chatBox");
    scrollToBottom(chatBox);
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
}

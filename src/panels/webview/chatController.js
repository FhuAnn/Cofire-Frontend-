// ====== Chat Controller ======

import { stateManager } from "./stateManager.js";
import { UIComponents } from "./uiComponents.js";
import {
  generateMessageId,
  generateLoadingId,
  scrollToBottom,
} from "./utils.js";
import { MESSAGE_TYPES, MODELS } from "./constants.js";

export class ChatController {
  constructor(vscode) {
    this.vscode = vscode;
    this.uiComponents = new UIComponents(vscode);
    this.lastUsedModel = stateManager.getSelectedModel();
  }

  send() {
    const model = stateManager.getSelectedModel();
    const questionInput = document.getElementById("question");
    const chatBox = document.getElementById("chatBox");

    const messageId = generateMessageId();
    const question = questionInput.value.trim();

    if (!question) {
      return;
    }

    // kiểm tra model
    const prevModel = this.lastUsedModel;
    const isNewModel = model !== prevModel;

    if (isNewModel) {
      chatBox.innerHTML = ""; 
      this.lastUsedModel = model; 
    }

    // Create user message
    const userBlock = this.uiComponents.createUserMessage(messageId, question);
    chatBox.appendChild(userBlock);

    // Create loading message
    const loadingId = generateLoadingId();
    const aiBlock = this.uiComponents.createLoadingMessage(loadingId);
    chatBox.appendChild(aiBlock);

    scrollToBottom(chatBox);

    // Prepare files to send
    const filesToSend = this.prepareFilesToSend();

    // Add file attachments to message
    filesToSend.forEach((file) => {
      const fileElement = this.uiComponents.createFileAttachElement(
        file,
        messageId
      );
      const parent = document.getElementById(messageId);
      if (parent) {
        parent.appendChild(fileElement);
      }
    });

    // Send message to extension
    this.vscode.postMessage({
      type: MESSAGE_TYPES.SEND_PROMPT,
      prompt: question,
      files: filesToSend,
      loadingId,
    });

    // Reset input and attached files
    this.resetAfterSend();
  }

  prepareFilesToSend() {
    let filesToSend = [];
    const currentFile = stateManager.getCurrentFile();
    const isInVisible = stateManager.isInVisible();

    // Add current file if visible and valid
    if (
      currentFile.relativePath &&
      !isInVisible &&
      !filesToSend.some(
        (f) =>
          f.relativePath === currentFile.relativePath &&
          !f.type &&
          (f.type !== "selection" ||
            f.selectedCode === currentFile.selectedCode)
      )
    ) {
      filesToSend.push({
        fileName: currentFile.fileName,
        code: currentFile.code,
        relativePath: currentFile.relativePath,
      });
    }

    // Add attached files
    filesToSend = [...filesToSend, ...stateManager.getAttachedFiles()];

    return filesToSend;
  }

  resetAfterSend() {
    const questionInput = document.getElementById("question");
    const attachedFilesDisplay = document.getElementById("addFiles");

    // Reset input
    questionInput.value = "";

    // Clear attached files
    stateManager.clearAttachedFiles();
    attachedFilesDisplay.innerHTML = "";
  }

  attachFile() {
    this.vscode.postMessage({ type: MESSAGE_TYPES.ATTACH_FILE });
  }

  toggleVisibility() {
    const isInVisible = stateManager.toggleVisibility();
    this.uiComponents.updateToggleButton(isInVisible);
    this.uiComponents.updateCurrentFileDisplay(
      stateManager.getCurrentFile(),
      isInVisible
    );
  }
}

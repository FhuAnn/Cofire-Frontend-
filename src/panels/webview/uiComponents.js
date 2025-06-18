// ====== UI Components ======

import { createIconElement, generateAttachId } from "./utils.js";
import { stateManager } from "./stateManager.js";
import { MESSAGE_TYPES } from "./constants.js";

export class UIComponents {
  constructor(vscode) {
    this.vscode = vscode;
    console.log("UIComponents inittial", this.vscode);
  }

  createUserMessage(messageId, question) {
    const userBlock = document.createElement("div");
    userBlock.className = "messageBlock";
    userBlock.id = messageId;
    userBlock.tabIndex = 0;

    const qDiv = document.createElement("div");
    qDiv.className = "q";

    const label = document.createElement("span");
    label.textContent = "🙋‍♂️ Bạn:\n\n";
    qDiv.appendChild(label);

    const content = document.createElement("div"); // Thay span bằng div cho linh hoạt
    content.className = "question-content"; // Thêm class để áp dụng CSS
    content.textContent = question;
    qDiv.appendChild(content);

    userBlock.appendChild(qDiv);
    return userBlock;
  }

  createLoadingMessage(loadingId) {
    const model = stateManager.getSelectedModel();
    const aiBlock = document.createElement("div");
    aiBlock.className = "messageBlock ai";
    aiBlock.id = loadingId;
    aiBlock.tabIndex = 0;
    aiBlock.innerHTML = `
      <div class="robot loading">🤖 ${model}: <i>đang xử lý...</i></div>
    `;
    return aiBlock;
  }

  createAIMessage(messageId, reply, model) {
    const aiBlock = document.createElement("div");
    aiBlock.className = "messageBlock ai";
    aiBlock.id = messageId;
    aiBlock.tabIndex = 0;
    aiBlock.innerHTML = `
      <div class="robot">🤖 ${model}: <i>${reply}</i></div>
    `;
    return aiBlock;
  }

  createFileAttachElement(file, containerId) {
    const initialID = generateAttachId(file);
    const div = document.createElement("div");
    div.className = "fileAttach";
    div.id = initialID;

    let content = "";
    if (file.selectedCode) {
      content = `${file.fileName} line ${file.selectionStart} - ${file.selectionEnd}`;
    } else {
      content = file.fileName || file.folderName;
    }

    // Add icon
    const iconImg = createIconElement(file.fileName || file.folderName);
    div.appendChild(iconImg);

    const textSpan = document.createElement("span");
    textSpan.textContent = content + " ";
    div.appendChild(textSpan);

    // Add click handler
    this.addFileClickHandler(div, file);

    return div;
  }

  addFileClickHandler(element, file) {
    element.onclick = () => {
      this.vscode.postMessage({
        type: MESSAGE_TYPES.GOTO_SELECTION,
        typeAttached: file.type,
        name: file.fileName || file.folderName,
        selectionStart: file.selectionStart,
        selectionEnd: file.selectionEnd,
        selectionStartCharacter: file.selectionStartCharacter,
        selectionEndCharacter: file.selectionEndCharacter,
        relativePath: file.relativePath,
        folderUri: file.folderUri || undefined,
      });
    };
  }

  createAttachedFileElement(data, type = "file") {
    const fileDiv = document.createElement("div");
    fileDiv.className = "fileAttach";
    fileDiv.title = data.fileName || data.folderName;

    // Add icon
    const iconImg = createIconElement(data.fileName || data.folderName);
    fileDiv.appendChild(iconImg);

    // Add file name
    const fileNameSpan = document.createElement("span");
    fileNameSpan.className = "fileName";

    if (type === "selection") {
      fileNameSpan.textContent = `${data.fileName}: line ${data.selectionStart} - ${data.selectionEnd}`;
    } else {
      fileNameSpan.textContent = data.fileName || data.folderName;
    }

    fileDiv.appendChild(fileNameSpan);

    // Add remove button
    const removeBtn = document.createElement("div");
    removeBtn.className = "remove";
    removeBtn.title = `Remove ${type}`;
    removeBtn.textContent = "X";

    return { fileDiv, removeBtn };
  }

  updateCurrentFileDisplay(currentFile, isInVisible) {
    const currentFileDisplay = document.getElementById("currentFile");
    const currentFileCard = document.getElementById("currentFileCard");

    if (!currentFile.relativePath) {
      currentFileCard.style.display = "none";
      return;
    }

    currentFileCard.style.display = "flex";

    // Clear current content
    currentFileDisplay.innerHTML = "";

    // Create icon element
    const iconImg = createIconElement(currentFile.fileName);
    currentFileDisplay.appendChild(iconImg);

    // Create text span
    const textSpan = document.createElement("span");
    if (!currentFile.selectedCode) {
      textSpan.textContent = currentFile.fileName;
    } else {
      textSpan.textContent = `${currentFile.fileName}: line ${currentFile.selectionStart} - ${currentFile.selectionEnd} `;
    }
    textSpan.textContent += " current";
    currentFileDisplay.appendChild(textSpan);

    // Update visibility styling
    if (isInVisible) {
      currentFileDisplay.classList.add("textLineThough");
    } else {
      currentFileDisplay.classList.remove("textLineThough");
    }
  }

  updateEmptyText() {
    const chatBox = document.getElementById("chatBox");
    const emptyText = document.getElementById("emptyText");

    if (!chatBox || !emptyText) {
      console.warn("Không tìm thấy phần tử chatBox hoặc emptyText.");
      return;
    }

    const chatMessages = chatBox.querySelectorAll(".messageBlock");

    if (chatMessages.length === 0) {
      emptyText.style.display = "block";
    } else {
      emptyText.style.display = "none";
    }
  }

  updateToggleButton(isInVisible) {
    const toggleBtn = document.getElementById("toggleVisibilityBtn");
    toggleBtn.textContent = isInVisible ? "🙈" : "👁️";
  }

  showNotification(message, type = "info", duration = 3000) {
    if (!document.getElementById("progress-fill-keyframes")) {
      const style = document.createElement("style");
      style.id = "progress-fill-keyframes";
      style.textContent = `
      @keyframes progress-fill {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
    `;
      document.head.appendChild(style);
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    const content = document.createElement("div");
    content.className = "notification-content";

    const icon = document.createElement("div");
    icon.className = "notification-icon";
    icon.innerHTML =
      type === "warning"
        ? "⚠️"
        : type === "error"
        ? "❌"
        : type === "success"
        ? "✅"
        : "ℹ️";

    const text = document.createElement("div");
    text.className = "notification-text";
    text.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.className = "notification-close";
    closeBtn.innerHTML = "×";
    closeBtn.onclick = () => this.hideNotification(notification);

    const progressBar = document.createElement("div");
    progressBar.className = "notification-progress";

    const progressFill = document.createElement("div");
    progressFill.className = "notification-progress-fill";

    progressBar.appendChild(progressFill);
    content.appendChild(icon);
    content.appendChild(text);
    content.appendChild(closeBtn);
    notification.appendChild(content);
    notification.appendChild(progressBar);

    // CSS
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    max-width: 400px;
    background: ${this.getNotificationColor(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    font-family: sans-serif;
    overflow: hidden;
  `;

    content.style.cssText = `
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 10px;
  `;

    icon.style.cssText = `font-size: 18px;`;
    text.style.cssText = `flex: 1; font-size: 14px;`;
    closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  `;

    progressBar.style.cssText = `
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
  `;

    progressFill.style.cssText = `
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    transform: translateX(-100%);
    animation: progress-fill ${duration}ms linear forwards;
  `;

    document.body.appendChild(notification);
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
    });

    const startTime = Date.now();
    let timeoutId = setTimeout(() => {
      this.hideNotification(notification);
    }, duration);

    notification.timeoutId = timeoutId;
    notification.startTime = startTime;
    notification.elapsed = 0;

    // Pause on hover
    notification.onmouseenter = () => {
      const now = Date.now();
      notification.elapsed = now - notification.startTime;
      progressFill.style.animationPlayState = "paused";
      clearTimeout(notification.timeoutId);
    };

    notification.onmouseleave = () => {
      const remaining = duration - notification.elapsed;
      progressFill.style.animationPlayState = "running";
      notification.startTime = Date.now(); // reset start for next pause
      notification.timeoutId = setTimeout(() => {
        this.hideNotification(notification);
      }, remaining);
    };
  }

  hideNotification(notification) {
    clearTimeout(notification.timeoutId);
    notification.style.transform = "translateX(120%)";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }

  getNotificationColor(type) {
    switch (type) {
      case "warning":
        return "linear-gradient(135deg, #ff9800, #f57c00)";
      case "error":
        return "linear-gradient(135deg, #f44336, #d32f2f)";
      case "success":
        return "linear-gradient(135deg, #4caf50, #388e3c)";
      default:
        return "linear-gradient(135deg, #2196f3, #1976d2)";
    }
  }
}

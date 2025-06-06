// chatManager.js - Quản lý chat và giao tiếp với AI

import { renderMarkdown, createMarkdownContainer } from './markdownUtils.js';
import { scrollToBottom, updateEmptyText } from './domUtils.js';

export class ChatManager {
  constructor(fileManager, vscode) {
    this.fileManager = fileManager;
    this.vscode = vscode;
    this.chatBox = document.getElementById("chatBox");
    this.questionInput = document.getElementById("question");
  }

  // Gửi tin nhắn
  sendMessage() {
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const question = this.questionInput.value.trim();
    
    if (!question) return;

    // Tạo message block cho user
    this.createUserMessage(messageId, question);
    
    // Tạo loading message cho AI
    const loadingId = this.createLoadingMessage();
    
    // Lấy files để gửi
    const filesToSend = this.fileManager.getFilesToSend();
    
    // Thêm file attachments vào message
    filesToSend.forEach(file => {
      this.fileManager.createFileAttachForMessage(file, messageId);
    });

    // Gửi request
    this.vscode.postMessage({
      type: "sendPromptToModel",
      prompt: question,
      files: filesToSend,
      loadingId,
    });

    // Reset input và attachments
    this.questionInput.value = "";
    this.fileManager.clearAttachments();
    
    scrollToBottom();
  }

  // Tạo message của user
  createUserMessage(messageId, question) {
    const userBlock = document.createElement("div");
    userBlock.className = "messageBlock";
    userBlock.id = messageId;
    userBlock.tabIndex = 0;
    userBlock.innerHTML = `
      <div class="q">
        🙋‍♂️ Bạn:
        <br><br>
        ${question}
      </div>
    `;
    this.chatBox.appendChild(userBlock);
  }

  // Tạo loading message
  createLoadingMessage() {
    const loadingId = `ai_loading_${Date.now()}`;
    const aiBlock = document.createElement("div");
    aiBlock.className = "messageBlock ai";
    aiBlock.id = loadingId;
    aiBlock.tabIndex = 0;
    aiBlock.innerHTML = `
      <div class="robot loading">🤖 AI: <i>đang xử lý...</i></div>
    `;
    this.chatBox.appendChild(aiBlock);
    return loadingId;
  }

  // Xử lý phản hồi từ AI
  handleAIReply(data) {
    const aiBlock = document.getElementById(data.loadingId);
    if (!aiBlock) return;

    const robotDiv = aiBlock.querySelector(".robot");
    if (!robotDiv) return;

    robotDiv.classList.remove("loading");

    // Tạo container cho markdown
    const mdContainer = createMarkdownContainer();
    renderMarkdown(data.reply, mdContainer);

    // Cập nhật nội dung
    robotDiv.innerHTML = `🤖 AI:`;
    robotDiv.appendChild(mdContainer);

    scrollToBottom();
  }

  // Khởi tạo event listeners
  initializeEventListeners() {
    // Enter để gửi tin nhắn
    this.questionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
        updateEmptyText();
      }
    });

    // Nút gửi
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        this.sendMessage();
        updateEmptyText();
      });
    }
  }
}
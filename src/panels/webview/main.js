// main.js - File chính khởi tạo ứng dụng

import { initialState } from './constants.js';
import { FileManager } from './fileManager.js';
import { ChatManager } from './chatManager.js';
import { EventHandlers } from './eventHandlers.js';
import { MessageHandlers } from './messageHandlers.js';
import { updateEmptyText } from './domUtils.js';

// Khởi tạo ứng dụng
class ChatExtension {
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.state = { ...initialState };
    
    // Khởi tạo các manager
    this.fileManager = new FileManager(this.state, this.vscode);
    this.chatManager = new ChatManager(this.fileManager, this.vscode);
    this.eventHandlers = new EventHandlers(this.state, this.vscode);
    this.messageHandler = new MessageHandlers(this.fileManager, this.chatManager);
  }

  // Khởi tạo ứng dụng
  initialize() {
    // Khởi tạo event handlers
    this.eventHandlers.initialize();
    this.chatManager.initializeEventListeners();
    this.messageHandler.initialize();

    // Cập nhật empty text khi DOM loaded
    document.addEventListener("DOMContentLoaded", () => {
      updateEmptyText();
    });

    console.log("Chat app initialized successfully");
  }
}

// Khởi tạo ứng dụng khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new ChatExtension();
  app.initialize();
});

// Export cho debugging (optional)
window.ChatExtension = ChatExtension;
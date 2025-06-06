// messageHandler.js - Xử lý tin nhắn từ extension

export class MessageHandlers {
  constructor(fileManager, chatManager) {
    this.fileManager = fileManager;
    this.chatManager = chatManager;
  }

  // Khởi tạo message listener
  initialize() {
    window.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });
  }

  // Xử lý tin nhắn từ extension
  handleMessage(data) {
    switch (data.type) {
      case "update":
        this.fileManager.updateCurrentFile(data);
        break;

      case "reply":
        this.chatManager.handleAIReply(data);
        break;

      case "fileAttached":
        this.fileManager.attachFile(data);
        break;

      case "selectionAttached":
        this.fileManager.attachSelection(data);
        break;

      case "folderAttached":
        this.fileManager.attachFolder(data);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }
}
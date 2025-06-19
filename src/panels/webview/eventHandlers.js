// ====== Event Handlers ======

import { stateManager } from "./stateManager.js";
import { ChatController } from "./chatController.js";
import { DropdownController } from "./dropdownController.js";
import { MessageHandler } from "./messageHandler.js";
import { UIComponents } from "./uiComponents.js";
import { MESSAGE_TYPES } from "./constants.js";

export class EventHandlers {
  constructor(vscode) {
    this.vscode = vscode;
    this.chatController = new ChatController(vscode);
    this.dropdownController = new DropdownController();
    this.messageHandler = new MessageHandler(vscode);
    this.uiComponents = new UIComponents(vscode);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.setupKeyboardEvents();
    this.setupButtonEvents();
    this.setupDragDropEvents();
    this.setupWindowEvents();
    this.setupDropdownEvents();
    this.setupMessageEvents();
  }

  setupKeyboardEvents() {
    const questionInput = document.getElementById("question");

    questionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.chatController.send();
        this.uiComponents.updateEmptyText();
      }
    });
  }

  setupButtonEvents() {
    // Send button
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        this.chatController.send();
        this.uiComponents.updateEmptyText();
      });
    }

    // Attach file button
    const attachFileBtn = document.getElementById("attachFileBtn");
    if (attachFileBtn) {
      attachFileBtn.addEventListener("click", () => {
        this.chatController.attachFile();
      });
    }

    // Toggle visibility button
    const toggleBtn = document.getElementById("toggleVisibilityBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.chatController.toggleVisibility();
      });
    }

    //Show list conversation
    const historyBtn = document.getElementById("historyBtn");
    if (historyBtn) {
      historyBtn.addEventListener("click", () => {
        console.log("History button clicked");
        this.vscode.postMessage({
          type: MESSAGE_TYPES.SHOW_HISTORY,
        });
      });
    }

     //Create empty chat / new chat
    const newChatBtn = document.getElementById("newChatBtn");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        console.log("New chat button clicked");
        this.uiComponents.resetChatBox();
        this.vscode.postMessage({
          type: MESSAGE_TYPES.NEW_CHAT,
        });
      });
    }
  }

  setupDragDropEvents() {
    const dropZone = document.getElementById("dropZone");

    window.addEventListener("dragenter", (e) => {
      e.preventDefault();
      stateManager.incrementDragCounter();
      dropZone.classList.add("active");
    });

    window.addEventListener("dragleave", (e) => {
      e.preventDefault();
      const count = stateManager.decrementDragCounter();
      if (count === 0) {
        dropZone.classList.remove("active");
      }
    });

    window.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    window.addEventListener("drop", async (e) => {
      e.preventDefault();
      stateManager.resetDragCounter();
      dropZone.classList.remove("active");

      const uriList = e.dataTransfer.getData("text/uri-list");
      console.log("Dropped URIs:", uriList);

      if (uriList) {
        const uris = uriList
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (uris.length > 0) {
          this.vscode.postMessage({
            type: MESSAGE_TYPES.FILES_DROPPED,
            uris: uris,
          });
        }
      }
    });
  }

  setupWindowEvents() {
    // Click outside dropdown to close
    window.addEventListener("click", (event) => {
      this.dropdownController.handleOutsideClick(event);
    });

    // DOMContentLoaded for initialization
    document.addEventListener("DOMContentLoaded", () => {
      this.uiComponents.updateEmptyText();
    });
  }

  setupDropdownEvents() {
    // Dropdown toggle button
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    if (dropdownToggle) {
      dropdownToggle.addEventListener("click", () => {
        this.dropdownController.toggleDropdown();
      });
    }

    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu) {
      dropdownMenu.addEventListener("click", (e) => {
        const target = e.target.closest(".dropdown-item");
        if (target) {
          const value = target.getAttribute("data-label");
          const isUserModel = target.classList.contains("user-model");
          this.dropdownController.selectModel(value);

          this.vscode.postMessage({
            type: "modelSelected",
            model: stateManager.getSelectedModel(),
            isUserModel,
          });
        }
      });
    }

    // Dropdown items

    const otherModels = document.getElementById("manageModels");
    console.log("Other Models Element:", otherModels);
    if (otherModels) {
      otherModels.addEventListener("click", () => {
        this.vscode.postMessage({
          type: "showOtherProviders",
        });

        console.log("Clicked on manageModels");

        this.dropdownController.closeDropdown();
      });
    }
  }

  setupMessageEvents() {
    // Listen for messages from VS Code extension
    window.addEventListener("message", (event) => {
      const data = event.data;
      console.log("Received message from extension:", data);
      this.messageHandler.handleMessage(data);
    });
  }
}

// ====== Main Application Initialization ======

import { EventHandlers } from './eventHandlers.js';
import { MarkdownRenderer } from './markdownRenderer.js';
import { stateManager } from './stateManager.js';
import { UIComponents } from './uiComponents.js';

class ChatExtension {
  constructor() {
    this.vscode = null;
    this.eventHandlers = null;
    this.markdownRenderer = null;
    this.uiComponents = null;
  }

  init() {
    try {
      // Initialize VS Code API
      this.vscode = acquireVsCodeApi();
      
      // Initialize components
      this.markdownRenderer = new MarkdownRenderer();
      this.uiComponents = new UIComponents(this.vscode);
      this.eventHandlers = new EventHandlers(this.vscode);

      // Set up initial UI state
      this.setupInitialState();

      console.log("Chat application initialized successfully");
    } catch (error) {
      console.error("Failed to initialize chat application:", error);
    }
  }

  setupInitialState() {
    // Update empty text display
    this.uiComponents.updateEmptyText();
    
    // Focus on question input
    const questionInput = document.getElementById("question");
    if (questionInput) {
      questionInput.focus();
    }

    // Initialize current file display
    const currentFile = stateManager.getCurrentFile();
    const isInVisible = stateManager.isInVisible();
    this.uiComponents.updateCurrentFileDisplay(currentFile, isInVisible);

    // Initialize toggle button
    this.uiComponents.updateToggleButton(isInVisible);

    console.log("Initial state setup completed");
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatExtension = new ChatExtension();
  window.chatExtension.init();
});


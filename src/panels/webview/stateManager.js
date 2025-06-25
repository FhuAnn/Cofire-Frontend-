// ====== State Manager ======

import { DEFAULT_MODEL } from "./constants.js";

class StateManager {
  constructor() {
    this.state = {
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
      isLoading: false,
      attachedFiles: [],
      isInVisible: false,
      selectedModel: DEFAULT_MODEL,
      dragCounter: 0,
    };
  }

  // Current file methods
  updateCurrentFile(data) {
    this.state.currentFile = {
      ...data,
    };
  }

  getCurrentFile() {
    return this.state.currentFile;
  }

  // Attached files methods
  addAttachedFile(file) {
    // Kiểm tra trùng lặp đơn giản hơn
    console.log("=== addAttachedFile called ===");
    console.log("New file:", file);
    console.log("Current attachedFiles:", this.state.attachedFiles);

    const exists = this.state.attachedFiles.some((f) => {
      // so sánh relativePath
      if (f.relativePath !== file.relativePath) return false;
      if (f.selectedCode || file.selectedCode) {
        return (
          f.selectionStart === file.selectionStart &&
          f.selectionEnd === file.selectionEnd &&
          f.selectionStartCharacter === file.selectionStartCharacter &&
          f.selectionEndCharacter === file.selectionEndCharacter
        );
      } 
      return true;
    });

    if (!exists) {
      // Thay vì mutate array, tạo array mới
      this.state = {
        ...this.state,
        attachedFiles: [...this.state.attachedFiles, file],
      };
      return true;
    }

    console.log("File already exists:", file.relativePath);
    return false;
  }

  removeAttachedFile(file) {
    this.state.attachedFiles = this.state.attachedFiles.filter(
      (f) => f !== file
    );
  }

  clearAttachedFiles() {
    this.state.attachedFiles = [];
  }

  getAttachedFiles() {
    return this.state.attachedFiles;
  }

  // Visibility methods
  toggleVisibility() {
    this.state.isInVisible = !this.state.isInVisible;
    return this.state.isInVisible;
  }

  isInVisible() {
    return this.state.isInVisible;
  }

  // Model selection methods
  setSelectedModel(model) {
    this.state.selectedModel = model;
  }

  getSelectedModel() {
    return this.state.selectedModel;
  }

  // Drag counter methods
  incrementDragCounter() {
    this.state.dragCounter++;
    return this.state.dragCounter;
  }

  decrementDragCounter() {
    this.state.dragCounter--;
    return this.state.dragCounter;
  }

  resetDragCounter() {
    this.state.dragCounter = 0;
  }

  getDragCounter() {
    return this.state.dragCounter;
  }
}

export const stateManager = new StateManager();

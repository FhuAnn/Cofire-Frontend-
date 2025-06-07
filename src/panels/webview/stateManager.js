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
      ...this.state.currentFile,
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
    // Kiểm tra trùng với currentFile
    const isCurrentFile =
      this.state.currentFile.relativePath === file.relativePath;

    if (isCurrentFile) {
      console.log("File is already the current file");
      return false;
    }
    const exists = this.state.attachedFiles.some((f) => {
      // Nếu cả 2 đều có type, so sánh theo type
      if (f.type && file.type) {
        if (f.type !== file.type) return false;

        if (f.type === "selection") {
          return (
            f.relativePath === file.relativePath &&
            f.selectionStart === file.selectionStart &&
            f.selectionEnd === file.selectionEnd
          );
        }
        return f.relativePath === file.relativePath;
      }

      // Nếu không có type hoặc chỉ 1 bên có type, so sánh relativePath
      return f.relativePath === file.relativePath;
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

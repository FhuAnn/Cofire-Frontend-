// fileManager.js - Quản lý file và attachment

import { createFileAttachElement, createIconElement } from './domUtils.js';

export class FileManager {
  constructor(state, vscode) {
    this.state = state;
    this.vscode = vscode;
    this.attachedFilesDisplay = document.getElementById("addFiles");
    this.currentFileDisplay = document.getElementById("currentFile");
    this.currentFileCard = document.getElementById("currentFileCard");
  }

  // Cập nhật thông tin file hiện tại
  updateCurrentFile(data) {
    if (!data.relativePath) {
      this.currentFileCard.style.display = "none";
      return;
    }
    
    this.currentFileCard.style.display = "flex";
    
    // Cập nhật state
    Object.assign(this.state.currentFile, {
      code: data.code,
      fileName: data.fileName,
      selectedCode: data.selectedCode,
      selectionStart: data.selectionStart,
      selectionEnd: data.selectionEnd,
      selectionStartCharacter: data.selectionStartCharacter,
      selectionEndCharacter: data.selectionEndCharacter,
      relativePath: data.relativePath
    });

    // Cập nhật UI
    this.updateCurrentFileDisplay();
  }

  // Cập nhật hiển thị file hiện tại
  updateCurrentFileDisplay() {
    this.currentFileDisplay.innerHTML = "";

    // Tạo icon
    const iconImg = createIconElement(this.state.currentFile.fileName);
    this.currentFileDisplay.appendChild(iconImg);

    // Tạo text
    const textSpan = document.createElement("span");
    if (!this.state.currentFile.selectedCode) {
      textSpan.textContent = this.state.currentFile.fileName;
    } else {
      textSpan.textContent = `${this.state.currentFile.fileName}: line ${this.state.currentFile.selectionStart} - ${this.state.currentFile.selectionEnd}`;
    }
    textSpan.textContent += " current";
    this.currentFileDisplay.appendChild(textSpan);
  }

  // Thêm file attachment
  attachFile(data) {
    // Kiểm tra trùng lặp
    if (this.state.attachedFiles.some(f => f.relativePath === data.relativePath)) {
      return;
    }

    const fileObj = {
      fileName: data.fileName,
      relativePath: data.relativePath,
      code: data.content,
    };
    
    this.state.attachedFiles.push(fileObj);
    this.addFileToUI(fileObj);
  }

  // Thêm selection attachment
  attachSelection(data) {
    // Kiểm tra trùng lặp selection
    if (this.state.attachedFiles.some(f => 
      f.relativePath === data.relativePath &&
      f.selectionStart === data.selectionStart &&
      f.selectionEnd === data.selectionEnd
    )) {
      return;
    }

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
    
    this.state.attachedFiles.push(fileObj);
    this.addFileToUI(fileObj);
  }

  // Thêm folder attachment  
  attachFolder(data) {
    // Kiểm tra trùng lặp folder
    if (this.state.attachedFiles.some(f => 
      f.relativePath === data.relativePath && f.type === "folder"
    )) {
      return;
    }

    const folderObj = {
      folderName: data.folderName,
      relativePath: data.relativePath,
      folderUri: data.folderUri,
      type: "folder",
    };
    
    this.state.attachedFiles.push(folderObj);
    this.addFileToUI(folderObj);
  }

  // Thêm file vào UI
  addFileToUI(fileObj) {
    const onRemove = () => {
      this.state.attachedFiles = this.state.attachedFiles.filter(f => f !== fileObj);
      this.attachedFilesDisplay.removeChild(fileDiv);
    };

    const fileDiv = createFileAttachElement(fileObj, onRemove);
    this.attachedFilesDisplay.appendChild(fileDiv);

    // Focus vào input
    document.getElementById("question").focus();
  }

  // Tạo file attach với click handler cho message
  createFileAttachForMessage(file, containerId) {
    const initialID = `fileAttach_${file.fileName || file.folderName}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const div = document.createElement("div");
    div.className = "fileAttach";
    div.id = initialID;

    let content = "";
    if (file.selectedCode) {
      content = `${file.fileName} line ${file.selectionStart} - ${file.selectionEnd}`;
    } else {
      content = file.fileName || file.folderName;
    }

    // Thêm icon
    const iconImg = createIconElement(file.fileName || file.folderName);
    div.appendChild(iconImg);

    // Thêm text
    const textSpan = document.createElement("span");
    textSpan.textContent = content + " ";
    div.appendChild(textSpan);

    // Thêm click handler
    div.onclick = () => {
      this.vscode.postMessage({
        type: "gotoSelection",
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

    // Thêm vào container
    const parent = document.getElementById(containerId);
    if (parent) {
      parent.appendChild(div);
    }
  }

  // Xóa tất cả attachments
  clearAttachments() {
    this.state.attachedFiles = [];
    this.attachedFilesDisplay.innerHTML = "";
  }

  // Lấy danh sách files để gửi
  getFilesToSend() {
    let filesToSend = [];

    // Thêm current file nếu không bị ẩn
    if (this.state.currentFile.relativePath && 
        !this.state.isInVisible && 
        !filesToSend.some(f => 
          f.relativePath === this.state.currentFile.relativePath &&
          !f.type &&
          (f.type !== "selection" || f.selectedCode === this.state.currentFile.selectedCode)
        )) {
      filesToSend.push({
        fileName: this.state.currentFile.fileName,
        code: this.state.currentFile.code,
        relativePath: this.state.currentFile.relativePath,
      });
    }

    return [...filesToSend, ...this.state.attachedFiles];
  }
}
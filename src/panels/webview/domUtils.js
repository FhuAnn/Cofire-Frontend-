// domUtils.js - Tiện ích thao tác DOM

import { iconMap } from './constants.js';

// Lấy icon cho file/folder
export function getIconForFile(filename) {
  const iconBase = document.body.getAttribute("data-icon-base");

  // Nếu là thư mục (không có extension)
  if (!filename.includes(".")) {
    return `${iconBase}/folder.svg`;
  }

  // Lấy extension từ phía sau tới trước để xử lý các file có nhiều dấu chấm
  // Ví dụ: helloworld.controller.js -> js, package.json -> json
  const parts = filename.split(".");
  if (parts.length < 2) {
    return `${iconBase}/${iconMap["default"]}`;
  }

  const ext = parts[parts.length - 1].toLowerCase();
  
  // Xử lý các trường hợp đặc biệt cho file có nhiều extension
  // Ví dụ: .controller.js, .service.ts, .spec.js, .test.js, etc.
  if (parts.length >= 3) {
    const secondLastPart = parts[parts.length - 2].toLowerCase();
    const combinedExt = `${secondLastPart}.${ext}`;
    
    // Kiểm tra các pattern phổ biến
    const specialPatterns = {
      'controller.js': 'js',
      'service.js': 'js', 
      'service.ts': 'ts',
      'controller.ts': 'ts',
      'spec.js': 'js',
      'test.js': 'js',
      'spec.ts': 'ts',
      'test.ts': 'ts',
      'config.js': 'js',
      'config.ts': 'ts',
      'module.js': 'js',
      'module.ts': 'ts',
      'component.tsx': 'tsx',
      'component.ts': 'ts'
    };
    
    if (specialPatterns[combinedExt]) {
      return `${iconBase}/${iconMap[specialPatterns[combinedExt]] || iconMap["default"]}`;
    }
  }

  return `${iconBase}/${iconMap[ext] || iconMap["default"]}`;
}

// Tạo element icon
export function createIconElement(filename) {
  const iconSrc = getIconForFile(filename);
  const iconImg = document.createElement("img");
  iconImg.src = iconSrc;
  iconImg.className = "file-icon";
  iconImg.style.width = "16px";
  iconImg.style.marginRight = "5px";
  return iconImg;
}

// Tạo element file attach
export function createFileAttachElement(file, onRemove) {
  const fileDiv = document.createElement("div");
  fileDiv.className = "fileAttach";
  fileDiv.title = file.fileName || file.folderName;

  // Add icon
  const iconImg = createIconElement(file.fileName || file.folderName);
  fileDiv.appendChild(iconImg);

  // Add file name
  const fileNameSpan = document.createElement("span");
  fileNameSpan.className = "fileName";
  
  let displayText = file.fileName || file.folderName;
  if (file.selectedCode) {
    displayText = `${file.fileName}: line ${file.selectionStart} - ${file.selectionEnd}`;
  }
  
  fileNameSpan.textContent = displayText;
  fileDiv.appendChild(fileNameSpan);

  // Add remove button
  const removeBtn = document.createElement("div");
  removeBtn.className = "remove";
  removeBtn.title = "Remove file";
  removeBtn.textContent = "X";
  removeBtn.onclick = onRemove;
  fileDiv.appendChild(removeBtn);

  return fileDiv;
}

// Cập nhật hiển thị empty text
export function updateEmptyText() {
  const chatBox = document.getElementById("chatBox");
  const emptyText = document.getElementById("emptyText");

  if (chatBox.children.length === 1) {
    emptyText.style.display = "block";
  } else {
    emptyText.style.display = "none";
  }
}

// Scroll chat box to bottom
export function scrollToBottom() {
  const chatBox = document.getElementById("chatBox");
  chatBox.scrollTop = chatBox.scrollHeight;
}
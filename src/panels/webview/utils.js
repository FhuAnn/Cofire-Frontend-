// ====== Utility Functions ======

import { ICON_MAP } from "./constants.js";

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
    return `${iconBase}/${ICON_MAP["default"]}`;
  }

  const ext = parts[parts.length - 1].toLowerCase();

  // Xử lý các trường hợp đặc biệt cho file có nhiều extension
  // Ví dụ: .controller.js, .service.ts, .spec.js, .test.js, etc.
  if (parts.length >= 3) {
    const secondLastPart = parts[parts.length - 2].toLowerCase();
    const combinedExt = `${secondLastPart}.${ext}`;

    // Kiểm tra các pattern phổ biến
    const specialPatterns = {
      "controller.js": "js",
      "service.js": "js",
      "service.ts": "ts",
      "controller.ts": "ts",
      "spec.js": "js",
      "test.js": "js",
      "spec.ts": "ts",
      "test.ts": "ts",
      "config.js": "js",
      "config.ts": "ts",
      "module.js": "js",
      "module.ts": "ts",
      "component.tsx": "tsx",
      "component.ts": "ts",
    };

    if (specialPatterns[combinedExt]) {
      return `${iconBase}/${
        ICON_MAP[specialPatterns[combinedExt]] || ICON_MAP["default"]
      }`;
    }
  }

  return `${iconBase}/${ICON_MAP[ext] || ICON_MAP["default"]}`;
}

export function generateMessageId() {
  return `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function generateLoadingId() {
  return `ai_loading_${Date.now()}`;
}

export function generateAttachId(file) {
  return (
    "fileAttach_" +
    (file.fileName || file.folderName || "") +
    "_" +
    (file.selectionStart || "") +
    "_" +
    (file.selectionEnd || "") +
    "_" +
    (file.selectionStartCharacter || "") +
    "_" +
    (file.selectionEndCharacter || "") +
    "_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 10000)
  );
}

export function createIconElement(filename, className = "file-icon") {
  const iconSrc = getIconForFile(filename);
  const iconImg = document.createElement("img");
  iconImg.src = iconSrc;
  iconImg.className = className;
  iconImg.style.width = "16px";
  iconImg.style.marginRight = "5px";
  return iconImg;
}

export function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

export function dedent(str) {
  const lines = str.replace(/^\n/, "").split("\n");
  const indentLength = lines.reduce((minIndent, line) => {
    if (line.trim() === "") {
      return minIndent;
    } // skip empty lines
    const match = line.match(/^(\s*)/);
    return Math.min(minIndent, match ? match[1].length : 0);
  }, Infinity);

  return lines.map((line) => line.slice(indentLength)).join("\n");
}

function addCopyAndGotoListeners(container,vscode) {
  container.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".code-wrapper");
      const codeEl = wrapper?.querySelector("code");
      if (!codeEl) return;

      navigator.clipboard
        .writeText(codeEl.innerText)
        .then(() => {
          btn.textContent = "Đã sao chép!";
          setTimeout(() => (btn.textContent = "Sao chép"), 1500);
        })
        .catch(() => {
          btn.textContent = "Lỗi!";
          setTimeout(() => (btn.textContent = "Sao chép"), 1500);
        });
    });
  });

  container.querySelectorAll(".code-mention").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const gotoPath = el.dataset.goto;
      if (!gotoPath) return;

      const [file, lineStr] = gotoPath.split(":");
      const line = parseInt(lineStr, 10);
      const mention = el.textContent.trim();

      console.log("Goto symbol:", {
        file,
        mention,
      });
      vscode.postMessage({
        type: "gotoSymbol",
        file,
        mention,
      });
    });
  });
}

export function revealHtmlBlocksGradually(
  sourceContainer,
  targetContainer,
  vscode,
  delay = 100
) {
  const blocks = Array.from(sourceContainer.children);
  let i = 0;

  const interval = setInterval(() => {
    if (i >= blocks.length) {
      clearInterval(interval);
      return;
    }

    const block = blocks[i].cloneNode(true); // clone để giữ style/format
    targetContainer.appendChild(block);
    addCopyAndGotoListeners(block,vscode);

    i++;
    scrollToBottom(targetContainer);
  }, delay);
}

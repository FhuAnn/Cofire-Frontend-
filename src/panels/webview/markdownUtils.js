// markdownUtils.js - Xử lý markdown và syntax highlighting

import { MARKED_OPTIONS } from './constants.js';

// Khởi tạo marked options
marked.setOptions(MARKED_OPTIONS);

// Tạo renderer tùy chỉnh
const renderer = new marked.Renderer();

renderer.code = (code, infostring) => {
  const lang = (infostring || "").toLowerCase();
  const language = lang || hljs.highlightAuto(code).language || "plaintext";
  const highlightedCode = hljs.highlight(code, { language }).value;

  const langLabel =
    language !== "plaintext" ? `<div class="lang-label">${language}</div>` : "";

  const copyBtn = `<button class="copy-btn" aria-label="Sao chép code" title="Sao chép code">Sao chép</button>`;

  return `
    <div class="code-wrapper">
      <pre class="hljs language-${language}">
        <code>${highlightedCode}</code>
      </pre>
        ${langLabel}
        ${copyBtn}
    </div>
  `;
};

// Hàm render markdown
export function renderMarkdown(mdText, container) {
  if (!container) return;

  container.innerHTML = marked.parse(mdText, { renderer });

  // Thêm event listener cho nút copy
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
}

// Tạo markdown container
export function createMarkdownContainer() {
  const mdContainer = document.createElement("div");
  mdContainer.className = "markdown-content";
  return mdContainer;
}
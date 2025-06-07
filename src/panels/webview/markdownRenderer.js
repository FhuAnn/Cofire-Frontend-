// ====== Markdown Renderer ======

import { MARKED_OPTIONS } from './constants.js';

export class MarkdownRenderer {
  constructor() {
    this.setupMarked();
  }

  setupMarked() {
    marked.setOptions(MARKED_OPTIONS);
    
    // Tạo renderer tùy chỉnh
    this.renderer = new marked.Renderer();
    this.renderer.code = this.renderCode.bind(this);
  }

  renderCode(code, infostring) {
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
  }

  renderMarkdown(mdText, container) {
    if (!container) return;

    container.innerHTML = marked.parse(mdText, { renderer: this.renderer });

    // Add copy button event listeners
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
}

export const markdownRenderer = new MarkdownRenderer();
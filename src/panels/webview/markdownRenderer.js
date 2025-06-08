// ====== Markdown Renderer ======

import { MARKED_OPTIONS } from "./constants.js";
import { dedent } from "./utils.js";

export class MarkdownRenderer {
  constructor() {
    this.setupMarked();
    this.inCodeBlock = false;
    this.codeBlockLines = [];
  }

  setupMarked() {
    marked.setOptions(MARKED_OPTIONS);

    // Tạo renderer tùy chỉnh
    this.renderer = new marked.Renderer();
    this.renderer.code = this.renderCode.bind(this);

    this.renderer.link = (href, title, text) => {
      if (href.startsWith("goto://")) {
        return `<a href="${href}" class="code-mention" data-goto="${href.slice(
          7
        )}">${text}</a>`;
      }
      const escapedTitle = title ? ` title="${title}"` : "";
      return `<a href="${href}"${escapedTitle}>${text}</a>`;
    };
  }

  renderCode(code, infostring) {
    const lang = (infostring || "").toLowerCase();
    const language = lang || hljs.highlightAuto(code).language || "plaintext";
    const highlightedCode = hljs.highlight(code, { language }).value;

    const langLabel =
      language !== "plaintext"
        ? `<div class="lang-label">${language}</div>`
        : "";

    const copyBtn = `<button class="copy-btn" aria-label="Sao chép code" title="Sao chép code">Sao chép</button>`;

    return dedent(`
      <div class="code-wrapper">
        <pre class="hljs language-${language}">
          <code>${highlightedCode}</code>
        </pre>
          ${langLabel}
          ${copyBtn}
      </div>
    `);
  }

  renderMarkdown(mdText, container, vscode) {
    console.log("Rendering markdown:", vscode);
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

    container.querySelectorAll(".code-mention").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const gotoPath = el.dataset.goto; // e.g. "src/utils/file.ts:42"
        if (!gotoPath) return;

        const [file, lineStr] = gotoPath.split(":");
        const line = parseInt(lineStr, 10);
        const mention = el.textContent.trim();

        console.log("Goto symbol:", {
          file,
          mention,
        });
        // Gửi message cho extension
        vscode.postMessage({
          type: "gotoSymbol",
          file,
          mention,
        });
      });
    });
  }

  

}

export const markdownRenderer = new MarkdownRenderer();

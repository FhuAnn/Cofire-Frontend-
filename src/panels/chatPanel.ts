export function getChatHtml(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: sans-serif; padding: 10px; }
        #fileName { font-weight: bold; margin-bottom: 10px; }
        #chatBox { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        .q { font-weight: bold; }
        .a { margin-left: 10px; }
        pre {   background: #f5f5f5; padding: 10px;border-radius: 6px;overflow-x: auto;font-family: monospace;}
        code {white-space: pre-wrap;font-size: 0.95em;}
      </style>
    </head>
    <body>
      <div id="fileName">📄 Đang xem: <span id="currentFile">...</span></div>
      <div id="chatBox"></div>
      <input id="question" placeholder="Nhập câu hỏi..." style="width: 80%"/>
      <button onclick="send()">Gửi</button>

      <script>
        const vscode = acquireVsCodeApi();
        const chatBox = document.getElementById('chatBox');
        const questionInput = document.getElementById('question');
        const currentFileDisplay = document.getElementById('currentFile');

        let currentCode = '';
        let currentFilename = '';

        function send() {
          const q = questionInput.value;
          if (!q) return;
          chatBox.innerHTML += \`<div class='q'>🙋‍♂️ Bạn: \${q}</div>\`;
          chatBox.innerHTML += \`<div class='q'>File \${currentFilename}</div>\`;
          vscode.postMessage({ prompt: q, code: currentCode, filename: currentFilename });
          questionInput.value = "";
        }
        function formatReply(text) {
            return text
            .replace(/\`\`\`(?:\\w+)?\\n?/g, "<pre><code>")
            .replace(/\`\`\`/g, "</code></pre>")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        }

        window.addEventListener('message', event => {
          const data = event.data;
          if (data.type === "update") {
            currentCode = data.code;
            currentFilename = data.fileName;
            currentFileDisplay.textContent = currentFilename;
          } else if (data.reply) {
            chatBox.innerHTML += \`<div class='a'>🤖 AI: \${data.reply}</div>\`;
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        });
      </script>
      
    </body>
    </html>
  `;
}

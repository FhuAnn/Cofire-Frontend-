// aiCodeChat.ts - Mở panel AI chat để giải thích mã
import * as vscode from "vscode";
import { callChatAI } from "../utils/apis";

export function openAIChatPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "aiChatPanel",
    "💬 Chat với AI",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getChatHtml();

  const history: { role: "user" | "assistant"; content: string }[] = [];

  panel.webview.onDidReceiveMessage(async (message) => {
    const { prompt } = message;

    history.push({ role: "user", content: prompt });

    try {
      const aiAnswer = await callChatAI(history); // gửi toàn bộ lịch sử
      history.push({ role: "assistant", content: aiAnswer });

      panel.webview.postMessage({ reply: aiAnswer });
    } catch (err: any) {
      panel.webview.postMessage({ reply: "❌ Lỗi khi gọi AI: " + err.message });
    }
  });
}
function getChatHtml(): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: sans-serif;
          padding: 10px;
        }
        #chatBox {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          margin-bottom: 10px;
        }
        .q {
          font-weight: bold;
          margin-top: 10px;
        }
        .a {
          margin-left: 10px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div id="chatBox"></div>
      <input id="question" placeholder="Nhập câu hỏi..." style="width: 80%;" />
      <button onclick="send()">Gửi</button>

      <script>
        const vscode = acquireVsCodeApi();
        const chatBox = document.getElementById('chatBox');
        const questionInput = document.getElementById('question');

        function send() {
          const q = questionInput.value.trim();
          if (!q) return;

          chatBox.innerHTML += \`<div class="q">🙋‍♂️ Bạn: </div>\`;
          vscode.postMessage({ prompt: q });
          questionInput.value = "";
        }

        window.addEventListener('message', event => {
          const a = event.data.reply;
          chatBox.scrollTop = chatBox.scrollHeight;
        });
      </script>
    </body>
    </html>
  `;
}

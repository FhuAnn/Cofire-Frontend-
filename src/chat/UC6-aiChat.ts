import * as vscode from "vscode";
import { getChatHtml } from "../panels/chatPanel";
import { callChatAI } from "../utils/apis";

let currentPanel: vscode.WebviewPanel | undefined;
let currentCode: string = "";
let currentFileName: string = "";

export function openAIChatPanel(context: vscode.ExtensionContext) {
  const updateEditorContent = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      currentCode = editor.document.getText();
      currentFileName =
        editor.document.fileName.split(/[/\\]/).pop() ?? "No content";
      if (currentPanel) {
        console.log("currentFileName", currentFileName);
        sendCodeToPanel(currentPanel, currentCode, currentFileName);
      }
    }
  };
  updateEditorContent();
  if (currentPanel) {
    currentPanel.reveal();
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    "chatWithAI",
    "Chat with AI",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  currentPanel = panel;

  panel.webview.html = getChatHtml();

  panel.webview.onDidReceiveMessage(async (message) => {
    const { prompt, code, filename } = message;
    const fullPrompt = `File: ${filename}

You are an expert developer assistant.

A user has a specific request. Prioritize fully understanding and responding to the user's intent **before** referring to the provided code. Only refer to the code as supporting context.

---

**User Request:**
${prompt}

---

**Code Context** (for reference only):
\`\`\`
${code}
\`\`\`

Your task:
- Focus mainly on addressing the user's request.
- If the user asks for improvements, suggest refactored code.
- If the user wants explanations, explain clearly and concisely.
- If the user is debugging, identify issues and recommend fixes.
- Only respond with code if explicitly asked or when it improves clarity.
- **Respect the language used in the user request.**

Return only the appropriate output, as if you're directly replying to the user, not restating the prompt.
`;
    try {
      const aiAnswer = await callChatAI(fullPrompt);
      panel.webview.postMessage({ reply: aiAnswer });
    } catch (err: any) {
      panel.webview.postMessage({ reply: "Lỗi khi gọi API" });
    }
  });
  panel.onDidDispose(() => {
    currentPanel = undefined;
  });
  //gửi dữ liệu ban đầu
  sendCodeToPanel(panel, currentCode, currentFileName);
  //theo dõi thay đổi focus editor
  vscode.window.onDidChangeActiveTextEditor(() => {
    updateEditorContent();
  });
}
function sendCodeToPanel(
  panel: vscode.WebviewPanel,
  code: string,
  fileName: string
) {
  console.log("changeee", fileName);
  panel.webview.postMessage({ type: "update", code, fileName });
}

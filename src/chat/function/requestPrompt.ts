import { callChatAI } from "../../utils/apis";
import * as vscode from "vscode";
export async function requestPrompt(message: any, panel: vscode.WebviewPanel) {
  const { prompt, files } = message;
  console.log("Requesting prompt with message:", message);
  let filesSection = "";
  if (Array.isArray(files)) {
    filesSection = files
      .map((f: any) => `File: ${f.fileName}\n\`\`\`\n${f.code}\n\`\`\`\n`)
      .join("\n");
  }
  const fullPrompt = `
You are an expert developer assistant.

A user has a specific request. Your priorities:
- Fully understand and address the user's intent.
- Use the provided code context only as supporting information.

User Request:
${prompt}

Code Context (for reference only):
${filesSection}

Instructions:
- Focus mainly on the user's request.
- If the user asks for improvements, suggest refactored code.
- If the user wants explanations, explain clearly and concisely.
- If the user is debugging, identify issues and recommend fixes.
- Only include code in your answer if the user explicitly asks for it, or if it improves clarity.
- Do NOT use markdown formatting (no triple backticks, no language tags) in your answer unless the user requests it.
- Respect the language used in the user request.

Reply directly to the user as if in a chat. Do not restate the prompt.
`;
  try {
    const aiAnswer = await callChatAI(fullPrompt);
    panel.webview.postMessage({ type: "reply", reply: aiAnswer });
  } catch (err: any) {
    panel.webview.postMessage({ reply: "Lỗi khi gọi API" });
  }
}

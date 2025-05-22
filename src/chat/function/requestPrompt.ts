import { callChatAI } from "../../utils/apis";
import * as vscode from "vscode";
export async function requestPrompt(message: any, panel: vscode.WebviewPanel) {
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
    panel.webview.postMessage({ type: "reply", reply: aiAnswer });
  } catch (err: any) {
    panel.webview.postMessage({ reply: "Lỗi khi gọi API" });
  }
}

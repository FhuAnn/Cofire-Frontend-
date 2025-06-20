import * as vscode from "vscode";
import { CustomError, MessageInConversation } from "../../types";
import { conversationController } from "./ConversationController.js";
import { callChatAI } from "../../utils/apis";
export async function requestPrompt(
  newChat: MessageInConversation,
  panel: vscode.WebviewPanel,
  modelAI: string
): Promise<string> {
  const { content, attachedFiles, loadingId } = newChat;
  let filesSection = "";
  if (Array.isArray(attachedFiles) && attachedFiles.length > 0) {
    filesSection = attachedFiles
      .map((f: any) => {
        if (!f.relativePath && !f.fileName) {
          throw new Error(
            "Invalid file object: missing relativePath or fileName"
          );
        }
        return `File: ${f.relativePath || f.fileName}\n\`\`\`${f.code}\`\`\`\n`;
      })
      .join("\n");
  }
  // Xử lý phần lịch sử chat trước đó

  let historySection = "";
  if (conversationController.getSummary()) {
    historySection += `Summary: ${conversationController.getSummary()}\n`;
  }
  const messages = conversationController.getMessages();
  if (Array.isArray(messages) && messages.length > 0) {
    // Lấy hết (hoặctối đa N tin gần nhất,
    // nhưng do logic clearOldMessages, chỉ còn 2 tin)
    const recent = conversationController
      .getMessages()
      .slice(-4)
      .map((msg) => (msg.role === "user" ? "User: " : "AI: ") + msg.content)
      .join("\n");
    historySection += recent;
  }
  const fullPrompt = `
You are an expert developer assistant.

A user has a specific request. Your priorities:
- Fully understand and address the user's intent.
- Use the provided code context only as supporting information.

Chat History (for context):
${historySection ? historySection : "No chat history available."}

User Request:
${content}

Code Context (for reference only):
${filesSection}

Instructions:
- Return your answer in Markdown format so it can be rendered as HTML.
- If code is included, format it using triple backticks (e.g., \`\`\`js).
- Use markdown for emphasis, lists, and structure.
- Be concise and clear.
- Respect the language used in the user request.
- Respond directly to the user in Markdown format.

Special formatting rule for code mentions:
- When referring to a function, variable, or class in code, format the reference using the following markdown link structure:
  - [\`symbolName\`](goto://relative/path/to/file.ts:lineNumber)
- For example:
  - [\`calculateTotal\`](goto://src/utils/math.ts:42)
- Only use this format for symbols in code that exist in specific files and lines.
`;

  try {
    // 2. Gọi AI chính để lấy câu trả lời
    const aiAnswer = await callChatAI(fullPrompt);
    panel.webview.postMessage({ type: "reply", reply: aiAnswer, loadingId });
    // 3. Thêm tin nhắn user và AI vào history
    const newUserChat: MessageInConversation = {
      role: "user",
      content: content,
      attachedFiles: attachedFiles,
    };
    console.log("Model AI:", modelAI)
    const newAiChat: MessageInConversation = {
      role: "ai",
      content: aiAnswer,
      model: modelAI,
    };
    conversationController.addMessagePairToHistory(newUserChat, newAiChat);

    // 4. Gọi hàm tóm tắt (nếu cần) và cập nhật summary mới
    //    Lấy summary hiện tại trước khi gọi:
    const newSummary = conversationController.getSummary();
    console.log("Summary mới:", newSummary);

    return aiAnswer;
  } catch (error: any) {
    const customError: CustomError =
      error instanceof Error ? error : new Error("Unknown error occurred");
    const errorMessage = `Error: ${customError.message}\nFile: ${customError.file}`;
    panel.webview.postMessage({
      type: "error",
      message: errorMessage,
      loadingId,
    });
    throw customError;
  }
}

import { ChatMessage } from "../../types";
import { callChatAI } from "../../utils/apis";
import { chatHistory, addMessageToHistory } from "./chat-history";
import * as vscode from "vscode";
import { summarizeChatHistory } from "./summarize-chat-history";
export async function requestPrompt(
  newChat: ChatMessage,
  panel: vscode.WebviewPanel
): Promise<string> {
  const { content, attachedFiles, loadingId } = newChat;
  console.log("chatHistory", chatHistory);
  let filesSection = "";
  if (Array.isArray(attachedFiles)) {
    filesSection = attachedFiles
      .map(
        (f: any) =>
          `File: ${f.relativePath || f.fileName}\n\`\`\`${f.code}\`\`\`\n`
      )
      .join("\n");
  }
  // Xử lý phần lịch sử chat trước đó

  let historySection = "";
  if (chatHistory.summary) {
    historySection += `Summary: ${chatHistory.summary}\n`;
  }

  if (Array.isArray(chatHistory.messages) && chatHistory.messages.length > 0) {
    // Lấy hết (hoặc   tối đa N tin gần nhất,
    // nhưng do logic clearOldMessages, chỉ còn 2 tin)
    const recent = chatHistory.messages
      .slice(-2)
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

Respond directly to the user in Markdown format.
`;

  try {
    // 2. Gọi AI chính để lấy câu trả lời
    const aiAnswer = await callChatAI(fullPrompt);
    panel.webview.postMessage({ type: "reply", reply: aiAnswer, loadingId });
    // 3. Thêm tin nhắn user vào history
    const newUserChat: ChatMessage = {
      role: "user",
      content: content,
      attachedFiles: attachedFiles,
    };
    addMessageToHistory(newUserChat);
    console.log("Đã thêm user vào chatHistory");
    // 4. Thêm tin nhắn AI vào history

    const newAiChat: ChatMessage = {
      role: "ai",
      content: aiAnswer,
    };
    addMessageToHistory(newAiChat);

    // 5. Gọi hàm tóm tắt (nếu cần) và cập nhật summary mới
    //    Lấy summary hiện tại trước khi gọi:
    const prevSummary = chatHistory.summary;
    const updatedSummary = await summarizeChatHistory(
      newUserChat,
      newAiChat,
      prevSummary
    );
    console.log("Summary mới:", updatedSummary);
    return aiAnswer;
  } catch (err: any) {
    console.error("Lỗi khi gọi API:", err);
    panel.webview.postMessage({ reply: "Lỗi khi gọi API" });
    return "Lỗi khi gọi API";
  }
}

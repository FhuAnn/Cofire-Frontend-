// summarize.ts (mới)
import { ChatMessage } from "../../types";
import { callChatAI } from "../../utils/apis";
import {
  chatHistory,
  setSummary,
  clearOldMessages,
  addMessageToHistory,
} from "./chat-history";

export async function summarizeChatHistory(
  userMessage: ChatMessage,
  aiMessage: ChatMessage,
  previousSummary?: string
): Promise<string> {
  // 1. Chuyển hai tin nhắn mới thành định dạng text
  const pairToSummarize = `
User: ${userMessage.content}
AI: ${aiMessage.content}
`;

  // 2. Tạo phần nội dung cần tóm tắt: nếu đã có summary cũ thì ghép vào
  const contentToSummarize = previousSummary
    ? `Previous Summary:
${previousSummary}

New Exchange:
${pairToSummarize}`
    : `New Exchange:
${pairToSummarize}`;

  // 3. Build prompt để gọi AI
  const summaryPrompt = `
You are a summarization assistant.

We have an existing summary of the conversation (if any), and then two newest messages (user and AI). 
Please produce a new, concise summary that:
- Retains all important context and decisions made so far.
- Incorporates the content from the previous summary (if given).
- Adds the two latest messages in a coherent, concise fashion.

${contentToSummarize}

New Summary:
`;

  // 4. Gọi AI để tóm tắt lại
  const newSummary = await callChatAI(summaryPrompt);

  // 5. Cập nhật lại chatHistory:
  //    - Ghi đè summary vừa mới sinh
  setSummary(newSummary);
  //      chỉ giữ lại hai tin nhắn mới (nếu bạn cần lưu chi tiết).
  //      Ở đây mình ví dụ là giữ lại userMessage và aiMessage để reference sau này,
  //      rồi xóa bớt tất cả tin older trước đó.
  addMessageToHistory(userMessage);
  addMessageToHistory(aiMessage);
  return newSummary.trim();
}

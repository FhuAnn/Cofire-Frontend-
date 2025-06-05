import { ChatHistory, ChatMessage } from "../../types";

export const chatHistory: ChatHistory = {
  chatId: "abc123",
  messages: [],
  summary: undefined,
};

export function addMessageToHistory(message: ChatMessage) {
  chatHistory.messages.push(message);
}
export function setSummary(s: string) {
  chatHistory.summary = s;
}

export function clearOldMessages() {
  chatHistory.messages = [];
  chatHistory.summary = undefined;
}

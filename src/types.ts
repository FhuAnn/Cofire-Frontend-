export interface ChatMessage {
  loadingId?: string;
  role: "user" | "ai";
  content: string | any;
  attachedFiles?: FileToSend[];
}

export interface ChatHistory {
  chatId: string;
  messages: ChatMessage[];
  summary?: string;
}

export interface FileToSend {
  fileName: string;
  relativePath: string;
  code: string;
}

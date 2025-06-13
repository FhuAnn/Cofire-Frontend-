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

export interface ChatAPIErrorResponse {
  success: boolean;
  message: string;
  file?: string;
  stack?: string;
  status?: number;
}

export interface ChatAPISuccessResponse {
  success: true;
  data: string;
}

export interface CustomError extends Error {
  status?: number;
  file?: string;
  stack?: string;
}

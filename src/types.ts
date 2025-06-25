export interface FileToSend {
  fileName: string;
  relativePath: string;
  selectionCode?: string;
  code?: string;
  selectionStart?: number;
  selectionEnd?: number;
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

export interface MessageInConversation {
  role: "user" | "ai";
  content: string;
  timestamp?: number;
  attachedFiles?: FileToSend[];
  loadingId?: string;
  model?: string;
}

export interface Conversation {
  _id?: string;
  userId?: string;
  tile: string;
  summary: string;
  messages: MessageInConversation[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateResponse {
  success: boolean;
  message: string;
}

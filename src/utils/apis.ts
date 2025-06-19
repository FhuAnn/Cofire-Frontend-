import axios, { AxiosError } from "axios";
import * as vscode from "vscode";
import {
  ChatAPIErrorResponse,
  ChatAPISuccessResponse,
  Conversation,
  MessageInConversation,
} from "../types";

export async function updateModels(
  model: string,
  apiKey: string = "",
  provider: string = ""
) {
  let json;
  if (!apiKey) {
    const res = await axios.post("http://localhost:5000/update-model-system", {
      selectedModel: model,
      provider,
    });
    json = res.data;
  } else {
    const res = await axios.post("http://localhost:5000/update-model-user", {
      selectedModel: model,
      provider,
      APIKey: apiKey,
    });
    json = res.data;
  }
  return json;
}

// AndreNguyen: 11/6/2025
export async function checkAPIKey(provider: string, APIKey: string) {
  console.log("check api key", provider, APIKey);
  const res = await axios.post("http://localhost:5000/check-api-key", {
    provider,
    APIKey,
  });
  console.log("checkAPIKey", res.data);
  const json = res.data;
  if (json.status === "error") {
    return false;
  }
  return true;
}

// AndreNguyen: 11/6/2025
export async function fetchModelFromProvider(
  provider: string,
  APIKey: string | undefined
) {
  if (!APIKey) return;
  const response = await axios.post("http://localhost:5000/list-models", {
    provider: provider,
    APIKey: APIKey,
  });
  console.log(response.data);
  const json = response.data;
  console.log("resultdjs", json);
  if (!json.success) {
    vscode.window.showErrorMessage(
      "Lấy danh sách mô hình thất bại: " + json.error
    );
    return json;
  }
  return json.models;
}

export async function callManualCompletionAI(
  prompt: string,
  language: string,
  context: string
) {
  console.log(prompt, language, context);
  const res = await axios.post("http://localhost:5000/manual-prompt", {
    prompt,
    language,
    context: context,
  });
  return res.data;
}
//UC1
export async function checkBackendStatus() {
  const res = await fetch("http://localhost:5000/status");
  const json = await res.json();

  return json as { status: string; error?: string };
}
let lastAbortController: AbortController | null = null;
//UC2
export async function callGetContinousCodeAISuggestion(
  context: string,
  language: string
): Promise<string | null> {
  if (lastAbortController) {
    lastAbortController.abort(); // huỷ request cũ
  }
  const controller = new AbortController();
  lastAbortController = controller;
  try {
    const response = await fetch("http://localhost:5000/suggest-typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: context, language: language }),
    });
    const result = (await response.json()) as { suggestion: string };
    return result.suggestion;
  } catch (err) {
    vscode.window.showErrorMessage("Không lấy được gợi ý từ AI Backend");
    return null;
  }
}
//UC3
export async function callAPISuggestBlock() {
  const res = await fetch("http://localhost:5000/suggest-block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      context: "Write a function that removes duplicate elements from an array",
    }),
  });
  return await res.json();
}
//UC4
export async function callExplainCodeAI(code: string, language: string) {
  try {
    const res = await fetch("http://localhost:5000/explain-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });
    const data = (await res.json()) as { data: string };
    return data?.data;
  } catch (err: any) {
    vscode.window.showErrorMessage("Explain code failed: " + err.message);
    return null;
  }
}

export async function callChatAI(userPrompt: string): Promise<string> {
  try {
    const response = await axios.post<
      ChatAPIErrorResponse | ChatAPISuccessResponse
    >(
      "http://localhost:5000/api/chat",
      {
        fullPrompt: userPrompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    if (response.data.success === false) {
      const errorData = response.data as ChatAPIErrorResponse;
      const error = new Error(errorData.message || "Unknown API error");
      error.message = errorData.message;
      (error as any).file = errorData.file || "Unknown file";
      (error as any).stack = errorData.stack || "";
      (error as any).status = errorData.status || response.status;
      throw error;
    }
    // Trả về dữ liệu nếu thành công
    console.log("response", response.data);
    return (response.data as ChatAPISuccessResponse).data;
  } catch (error) {
    // Xử lý lỗi từ axios hoặc lỗi khác
    let customError: Error & { status?: number; file?: string };
    if (error instanceof AxiosError) {
      // Lỗi từ axios (mạng, timeout, hoặc phản hồi API)
      customError = new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to call chat API"
      );
      customError.status = error.response?.status || 500;
      customError.file = error.response?.data?.file || "callChatAI.ts";
      customError.stack = error.response?.data?.stack || error.stack;
    } else {
      // Lỗi khác (validation hoặc lỗi runtime)
      customError = new Error((error as Error).message || "Unexpected error");
      customError.status = 500;
      customError.file = "callChatAI.ts";
      customError.stack = (error as Error).stack;
    }

    // Ghi log lỗi để debug
    console.error(
      `Chat API Error in ${customError.file}:`,
      customError.message,
      customError.stack
    );

    // Ném lỗi để tầng trên xử lý
    throw customError;
  }
}

export async function callAPIInlineCompletionCode(
  fullText: string,
  codeUntilCursor: string,
  language: string
) {
  const response = await axios.post(
    "http://localhost:5000/api/inline-completion",
    {
      full: fullText,
      codeUntilCursor: codeUntilCursor,
      language: language,
    }
  );
  return response.data.data;
}

export async function callAPIGetConversationHistory(userId: string): Promise<{
  conversations: Conversation[];
  message?: string;
}> {
  const response = await axios.get(
    `http://localhost:5000/api/v1/history/getConversationList?userId=${userId}`
  );
  console.log("response", response);

  if (response.data.success) {
    return {
      conversations: response.data.data,
      message: response.data.message,
    };
  } else {
    throw new Error(
      response.data.message || "Failed to fetch conversation history list"
    );
  }
}

export async function callAPIGetConversationDetail(
  conversationId: string
): Promise<{
  messagesInConversation: MessageInConversation[];
  message?: string;
}> {
  const response = await axios.get(
    `http://localhost:5000/api/v1/history/getConversationDetail?conversationId=${conversationId}`
  );
  if (response.data.success) {
    console.log("response", response.data);
    return {
      messagesInConversation: response.data.data,
      message: response.data.message,
    };
  } else {
    throw new Error(
      response.data.message || "Failed to fetch conversation detail"
    );
  }
}

export async function callAPIWriteMessagePairToConversation(
  message: MessageInConversation,
  userId?: string,
  conversationId?: string,
  summary?: string,
  model?: string
): Promise<{
  message?: string;
  newOrUpdateConversation?: Conversation;
}> {
  console.log("callđssdsds", message, userId, conversationId, summary);
  try {
    const response = await axios.post(
      `http://localhost:5000/api/v1/history/message`,
      {
        userId,
        conversationId,
        role: message.role,
        content: message.content,
        summary,
        model,
      }
    );
    if (response.data.success) {
      return {
        message: response.data.message,
        newOrUpdateConversation: response.data.data,
      };
    } else {
      throw new Error(
        response.data.message ||
          "Failed to fetch store a message in conversation"
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "Error in callAPIWriteMessagePairToConversation:",
        error.response.data
      );
      throw new Error(
        error.response.data?.message ||
          "Failed to write message pair to conversation"
      );
    } else {
      console.error("Error in callAPIWriteMessagePairToConversation:", error);
      throw new Error(
        (error as Error).message ||
          "Failed to write message pair to conversation"
      );
    }
  }
}

export async function callAPIGetFirstConversation(userId: string): Promise<{
  message?: string;
  firstConversation?: Conversation;
}> {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/v1/history/getFirstConversation?userId=${userId}`
    );
    if (response.data.success) {
      return {
        firstConversation: response.data.data,
        message: response.data.message,
      };
    } else {
      throw new Error(
        response.data.message || "Failed to fetch first conversation"
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "Error in callAPIWriteMessagePairToConversation:",
        error.response.data
      );
      throw new Error(
        error.response.data?.message ||
          "Failed to write message pair to conversation"
      );
    } else {
      console.error("Error in callAPIWriteMessagePairToConversation:", error);
      throw new Error(
        (error as Error).message ||
          "Failed to write message pair to conversation"
      );
    }
  }
}

export async function callAPIGetSummary(
  prevSummary: string,
  userMessage: MessageInConversation,
  aiMessage: MessageInConversation
): Promise<string> {
  try {
    const response = await axios.post<
      ChatAPIErrorResponse | ChatAPISuccessResponse
    >(
      "http://localhost:5000/api/summary",
      {
        prevSummary,
        userMessage,
        aiMessage,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    if (response.data.success === false) {
      const errorData = response.data as ChatAPIErrorResponse;
      const error = new Error(errorData.message || "Unknown API error");
      error.message = errorData.message;
      (error as any).file = errorData.file || "Unknown file";
      (error as any).stack = errorData.stack || "";
      (error as any).status = errorData.status || response.status;
      throw error;
    }
    // Trả về dữ liệu nếu thành công
    console.log("response", response.data);
    return (response.data as ChatAPISuccessResponse).data;
  } catch (error) {
    // Xử lý lỗi từ axios hoặc lỗi khác
    let customError: Error & { status?: number; file?: string };
    if (error instanceof AxiosError) {
      // Lỗi từ axios (mạng, timeout, hoặc phản hồi API)
      customError = new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to call chat API"
      );
      customError.status = error.response?.status || 500;
      customError.file = error.response?.data?.file || "callChatAI.ts";
      customError.stack = error.response?.data?.stack || error.stack;
    } else {
      // Lỗi khác (validation hoặc lỗi runtime)
      customError = new Error((error as Error).message || "Unexpected error");
      customError.status = 500;
      customError.file = "callChatAI.ts";
      customError.stack = (error as Error).stack;
    }

    // Ghi log lỗi để debug
    console.error(
      `Chat API Error in ${customError.file}:`,
      customError.message,
      customError.stack
    );

    // Ném lỗi để tầng trên xử lý
    throw customError;
  }
}

export async function callAPIDeleteConversation(
  conversationId: string
): Promise<{ message?: string; success: boolean }> {
  const response = await axios.post(
    `http://localhost:5000/api/v1/history/deleteConversation?conversationId=${conversationId}`
  );
  if (response.data.success) {
    return {
      message: response.data.message,
      success: true,
    };
  } else {
    throw new Error(response.data.message || "Failed to delete conversation");
  }
}

export async function callAPICheckAndGetLoginStatus() {
  try {
    console.log("fetching login status...");
    const res = await axios.get("http://localhost:5000/api/v1/login/user", {
      withCredentials: true,
    });
    if (res.data.success) {
      return { success: true, userId: res.data.userInfo.id };
    } else {
      // Nếu không đăng nhập, trả về false
      return { succees: false, userId: null };
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    return { success: false, userID: null };
  }
}

import axios, { AxiosError } from "axios";
import * as vscode from "vscode";
import { ChatAPIErrorResponse, ChatAPISuccessResponse } from "../types";

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
    console.log("bien", context, language);
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

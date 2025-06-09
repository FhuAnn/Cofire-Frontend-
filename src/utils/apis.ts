import axios from "axios";
import * as vscode from "vscode";


export async function updateModels(model: string) {
  const res = await axios.post("http://localhost:5000/update-model", {
    selectedModel: model,
  });
  const json = res.data;
  return json ;
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

  return json as { status: string, error?: string };
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
  //console.log("call api chatAI", userPrompt);
  const response = await axios.post("http://localhost:5000/api/chat", {
    fullPrompt: userPrompt,
  });

  return response.data.data;
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

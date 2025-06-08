import * as vscode from "vscode";
import { callAPIInlineCompletionCode } from "../utils/apis";
export const inlineCompletionProvider: vscode.InlineCompletionItemProvider = {
  provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    return new Promise((resolve) => {
      const fullText = document.getText();
      const codeUntilCursor = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position)
      );
      const language = document.languageId;

      debounceCallAPI(fullText, codeUntilCursor, language, (result) => {
        if (result) {
          resolve([
            new vscode.InlineCompletionItem(
              result,
              new vscode.Range(position, position)
            ),
          ]);
        } else {
          resolve([]); // không gợi ý nếu rỗng
        }
      });
    });
  },
};

let lastCode = "";
let lastPrompt = "";
let lastResult = "";
let debounceTimer: NodeJS.Timeout | undefined;

function debounceCallAPI(
  fullText: string,
  prompt: string,
  language: string,
  callback: (result: string) => void
) {
  if (debounceTimer) {clearTimeout(debounceTimer);}

  debounceTimer = setTimeout(async () => {
    if (fullText === lastCode && prompt === lastPrompt) {
      return callback(lastResult);
    }

    try {
      const result = await callAPIInlineCompletionCode(
        fullText,
        prompt,
        language
      );
      lastCode = fullText;
      lastPrompt = prompt;
      lastResult = result;
      callback(result);
    } catch (err) {
      console.error("Inline completion error:", err);
      callback(""); // fallback to empty
    }
  }, 3000); // delay 500ms sau khi ngưng gõ
}

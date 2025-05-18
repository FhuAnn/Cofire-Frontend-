import * as vscode from "vscode";
import { callGetAISuggestion } from "../utils/apis";

export function registerInlineSuggestionProvider() {
  return vscode.languages.registerInlineCompletionItemProvider(
    ["javascript", "typescript", "python", "csharp"],
    {
      async provideInlineCompletionItems(document, position, context, token) {
        const language = document.languageId;

        const range = new vscode.Range(
          Math.max(position.line - 20, 0),
          0,
          position.line,
          position.character
        );
        const codeContext = document.getText(range);

        try {
          const suggestion = await callGetAISuggestion(language, codeContext);

          if (!suggestion) return [];

          return [
            {
              insertText: suggestion,
              range: new vscode.Range(position, position),
            },
          ];
        } catch (err) {
          vscode.window.showErrorMessage("AI Suggestion Error: " + err);
          return [];
        }
      },
    }
  );
}

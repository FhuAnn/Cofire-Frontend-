import * as vscode from "vscode";
import { callContextCompletionAI } from "../utils/apis";

export function registerCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescript", "python", "csharp"],
    {
      async provideCompletionItems(document, position) {
        const language = document.languageId;
        const textBeforeCursor = document.getText(
          new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 20), 0),
            position
          )
        );

        try {
          const suggestions = await callContextCompletionAI(
            language,
            textBeforeCursor
          );

          return suggestions.map((item: any) => {
            const completion = new vscode.CompletionItem(
              item.label,
              vscode.CompletionItemKind.Snippet
            );
            completion.insertText = new vscode.SnippetString(item.insertText);
            completion.detail = item.detail;
            completion.documentation = new vscode.MarkdownString(
              item.documentation || ""
            );
            return completion;
          });
        } catch (err: any) {
          vscode.window.showErrorMessage("AI Suggestion Error: " + err.message);
          return [];
        }
      },
    },
    "." // Trigger sau dấu `.`
  );
}

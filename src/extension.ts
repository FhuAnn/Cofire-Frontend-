import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
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
          const res = await axios.post("http://localhost:5000/suggest", {
            language,
            context: textBeforeCursor,
          });

          const suggestions = res.data;
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
  context.subscriptions.push(provider);

  // === Lệnh Ctrl+I để gọi AI gợi ý từ prompt ===
  const command = vscode.commands.registerCommand(
    "cofire.suggestCode",
    async () => {
      const input = await vscode.window.showInputBox({
        placeHolder: "Nhập yêu cầu AI, ví dụ: viết hàm tính giai thừa",
      });

      if (!input) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const language = editor.document.languageId;
      const position = editor.selection.active;
      const contextText = editor.document.getText(
        new vscode.Range(
          new vscode.Position(Math.max(0, position.line - 20), 0),
          position
        )
      );
      try {
        const res = await axios.post("http://localhost:5000/manual-prompt", {
          prompt: input,
          language: language,
          context: contextText,
        });

        const code = res.data.code || res.data;

        const accept = "Accept";
        const reject = "Cancel";

        const choice = await vscode.window.showInformationMessage(
          "AI đã gợi ý đoạn code, bạn có muốn chèn không?",
          accept,
          reject
        );

        if (choice === accept) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, code);
          });
        } else {
          // Người dùng không đồng ý, không làm gì hoặc thông báo khác
          vscode.window.showInformationMessage("Bạn đã hủy chèn code.");
        }
      } catch (err: any) {
        vscode.window.showErrorMessage("Lỗi gọi AI: " + err.message);
      }
    }
  );
  context.subscriptions.push(command);
}

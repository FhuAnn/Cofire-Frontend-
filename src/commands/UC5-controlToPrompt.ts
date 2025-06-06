import * as vscode from "vscode";
import { callManualCompletionAI } from "../utils/apis";

export async function registerSuggestCodeCommand() {
  // === Lệnh Ctrl+I để gọi AI gợi ý từ prompt ===
  const input = await vscode.window.showInputBox({
    placeHolder: "Nhập yêu cầu AI, ví dụ: viết hàm tính giai thừa",
  });
  if (!input) { return; }
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  const language = editor.document.languageId;
  const position = editor.selection.active;
  const contextText = editor.document.getText(
    new vscode.Range(
      new vscode.Position(Math.max(0, position.line - 20), 0),
      position
    )
  );
  try {
    const res = await callManualCompletionAI(input, language, contextText);
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
  } catch (err) {
    vscode.window.showErrorMessage("Lỗi gọi AI: " + err);
  }
}

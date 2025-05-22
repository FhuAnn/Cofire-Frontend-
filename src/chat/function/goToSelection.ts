import * as vscode from "vscode";
export async function handleGotoSelection(message: any) {
  const {
    fileName,
    selectionStart,
    selectionEnd,
    selectionStartCharacter,
    selectionEndCharacter,
  } = message;
  // Tìm file đang mở trong workspace
  const files = await vscode.workspace.findFiles(`**/${fileName}`);
  if (files.length > 0) {
    const doc = await vscode.workspace.openTextDocument(files[0]);
    const editor = await vscode.window.showTextDocument(
      doc,
      vscode.ViewColumn.One
    );
    // Chuyển selection về 0-based
    const start = new vscode.Position(
      (selectionStart ?? 1) - 1,
      selectionStartCharacter ?? 0
    );
    const end = new vscode.Position(
      (selectionEnd ?? 1) - 1,
      selectionEndCharacter ?? 0
    );
    editor.selection = new vscode.Selection(start, end);
    editor.revealRange(
      new vscode.Range(start, end),
      vscode.TextEditorRevealType.InCenter
    );
  } else {
    vscode.window.showWarningMessage(`Không tìm thấy file: ${fileName}`);
  }
}

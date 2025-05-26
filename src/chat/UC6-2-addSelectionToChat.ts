import * as vscode from "vscode";
import { openAIChatPanel } from "./UC6-aiChat";
import { currentPanel } from "../panels/panelState";

export async function addSelectionToChat(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showWarningMessage("Không có đoạn code nào được chọn.");
    return;
  }
  console.log(
    "addSelectionToChat called with editor:",
    editor.document.fileName
  );
  // Nếu panel chưa mở, mở panel chat
  if (!currentPanel) {
    openAIChatPanel(context);
  }
  const document = editor.document;
  const selectedCode = document.getText(editor.selection);
  const fileName = document.fileName.split(/[/\\]/).pop() || document.fileName;
  const selectionStart = editor.selection.start.line + 1;
  const selectionEnd = editor.selection.end.line + 1;
  const selectionStartCharacter = editor.selection.start.character;
  const selectionEndCharacter = editor.selection.end.character;
  const fullPath = document.fileName;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const relativePath = workspaceFolder
    ? vscode.workspace.asRelativePath(fullPath)
    : fullPath;

  currentPanel?.webview.postMessage({
    type: "selectionAttached",
    fileName,
    relativePath,
    selectedCode,
    selectionStart,
    selectionEnd,
    selectionStartCharacter,
    selectionEndCharacter,
  });
}

import * as vscode from "vscode";
import { openAIChatPanel } from "./UC6-aiChat";
import { currentPanel } from "../panels/panelState";
export async function addFileToChat(
  context: vscode.ExtensionContext,
  fileUri: vscode.Uri
) {
    console.log("addFileToChat called with fileUri:", fileUri.toString());
  // Nếu panel chưa mở, mở panel chat
  if (!currentPanel) {
    openAIChatPanel(context);
  }
  // Đọc nội dung file
  const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
  const content = (await vscode.workspace.fs.readFile(fileUri)).toString();
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
  const relativePath = workspaceFolder
    ? vscode.workspace.asRelativePath(fileUri)
    : fileUri.fsPath;

  // Gửi message sang webview
  currentPanel?.webview.postMessage({
    type: "fileAttached",
    fileName,
    relativePath,
    content,
  });
}


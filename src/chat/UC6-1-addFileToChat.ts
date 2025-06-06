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
  const stat = await vscode.workspace.fs.stat(fileUri);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
  const relativePath = workspaceFolder
    ? vscode.workspace.asRelativePath(fileUri)
    : fileUri.fsPath;

  if (stat.type === vscode.FileType.Directory) {
    // Nếu là folder, gửi thông tin folder
    currentPanel?.webview.postMessage({
      type: "folderAttached",
      folderName: fileUri.path.split("/").pop() || fileUri.fsPath,
      relativePath,
      folderUri: fileUri.toString(),
    });
  } else {
    // Nếu là file, gửi nội dung file như cũ
    const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
    const content = (await vscode.workspace.fs.readFile(fileUri)).toString();
    currentPanel?.webview.postMessage({
      type: "fileAttached",
      fileName,
      relativePath,
      content,
    });
  }
}


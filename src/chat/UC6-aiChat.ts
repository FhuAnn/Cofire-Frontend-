import * as vscode from "vscode";
import * as path from "path";

import { getChatHtml } from "../panels/chatPanel";
import { requestPrompt } from "./function/requestPrompt";
import { handleGotoSelection } from "./function/goToSelection";
import { currentPanel, setCurrentPanel } from "../panels/panelState";
import { ChatMessage, FileToSend } from "../types";

let currentCode: string = "";
let currentFileName: string = "";
let relativePath: string = "";
export function openAIChatPanel(context: vscode.ExtensionContext) {
  const updateEditorContent = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      currentCode = editor.document.getText();
      currentFileName =
        editor.document.fileName.split(/[/\\]/).pop() ?? "No content";
      //Lấy selection nếu có
      const selection = editor.selection;
      let selectedCode = "";
      let selectionStart = 0;
      let selectionEnd = 0;
      let selectionStartCharacter = 0;
      let selectionEndCharacter = 0;
      if (!selection.isEmpty) {
        selectedCode = editor.document.getText(selection);
        selectionStart = selection.start.line + 1; // dòng bắt đầu (1-based)
        selectionEnd = selection.end.line + 1; // dòng kết thúc (1-based)
        selectionStartCharacter = selection.start.character;
        selectionEndCharacter = selection.end.character;
      }
      const fullPath = editor.document.fileName;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      const relativePath = workspaceFolder
        ? vscode.workspace.asRelativePath(fullPath)
        : fullPath;
      if (currentPanel) {
        sendCurentFileToPanel(
          currentPanel,
          currentCode,
          currentFileName,
          selectedCode,
          selectionStart,
          selectionEnd,
          selectionStartCharacter,
          selectionEndCharacter,
          relativePath
        );
      }
    }
  };
  updateEditorContent();
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Two, true);
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    "chatWithAI",
    "Chat with AI",
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  setCurrentPanel(panel);

  panel.webview.html = getChatHtml(panel, context);

  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.type) {
      case "gotoSelection":
        //console.log("gotoSelection", message);
        await handleGotoSelection(message);
        break;
      case "sendPromptToModel": {
        console.log("sendPromptToModel", message);
        let filesToSend: FileToSend[] = [];

        for (const f of message.files) {
          if (f.type === "folder") {
            const folderUri = vscode.Uri.parse(f.folderUri);
            const files = await vscode.workspace.findFiles(
              new vscode.RelativePattern(folderUri, "**/*"),
              "**/node_modules/**"
            );
            for (const fileUri of files) {
              const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
              const content = (
                await vscode.workspace.fs.readFile(fileUri)
              ).toString();
              const workspaceFolder =
                vscode.workspace.getWorkspaceFolder(fileUri);
              const relativePath = workspaceFolder
                ? vscode.workspace.asRelativePath(fileUri)
                : fileUri.fsPath;
              console.log("File to send:", fileName, relativePath, content);
              filesToSend.push({
                fileName,
                relativePath,
                code: content,
              });
            }
          } else {
            filesToSend.push(f);
          }
        }
        console.log("Đoạn chat hiện tại chuẩn bị", filesToSend);
        // Lấy nội dung của file hiện tại
        const newChatToSend: ChatMessage = {
          role: "user",
          content: message.prompt,
          attachedFiles: filesToSend,
          loadingId: message.loadingId,
        };
        await requestPrompt(newChatToSend, panel);
        break;
      }
      case "attachFile": {
        // Lấy tất cả file và folder trong workspace (trừ node_modules)
        const filesAndFolders = await vscode.workspace.findFiles(
          "**",
          "**/node_modules/**"
        );
        const items = filesAndFolders.map((uri) => ({
          label: vscode.workspace.asRelativePath(uri),
          uri,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: "Chọn file hoặc thư mục context để đính kèm",
        });
        if (picked) {
          const fileUri = picked.uri;
          const stat = await vscode.workspace.fs.stat(fileUri);
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
          const relativePath = workspaceFolder
            ? vscode.workspace.asRelativePath(fileUri)
            : fileUri.fsPath;

          if (stat.type === vscode.FileType.Directory) {
            const bytes = await vscode.workspace.fs.readFile(fileUri);
            const content = new TextDecoder("utf-8").decode(bytes);
            panel.webview.postMessage({
              type: "folderAttached",
              folderName: fileUri.path.split("/").pop() || fileUri.fsPath,
              relativePath,
              folderUri: fileUri.toString(),
              content,
            });
          } else {
            const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
            const content = (
              await vscode.workspace.fs.readFile(fileUri)
            ).toString();
            panel.webview.postMessage({
              type: "fileAttached",
              fileName,
              relativePath,
              content,
            });
          }
        }
        break;
      }
      case "filesDropped": {
        const uris: string[] = message.uris;
        console.log("Files dropped:", uris);

        for (const uriString of uris) {
          try {
            const fileUri = vscode.Uri.parse(uriString);
            // Lấy thông tin file (stat, workspace folder, relativePath)
            const stat = await vscode.workspace.fs.stat(fileUri);
            const workspaceFolder =
              vscode.workspace.getWorkspaceFolder(fileUri);
            const relativePath = workspaceFolder
              ? vscode.workspace.asRelativePath(fileUri)
              : fileUri.fsPath;
            const fileName = path.basename(fileUri.fsPath);

            if (stat.type === vscode.FileType.Directory) {
              // Nếu vô tình kéo thư mục
              panel.webview.postMessage({
                type: "folderAttached",
                folderName: fileName,
                relativePath,
                folderUri: fileUri.toString(),
              });
            } else {
              // Nếu là file, đọc nội dung và gửi về như attachFile
              const bytes = await vscode.workspace.fs.readFile(fileUri);
              const content = new TextDecoder("utf-8").decode(bytes);
              console.log("prepare attach file");
              panel.webview.postMessage({
                type: "fileAttached",
                fileName,
                relativePath,
                content,
              });
            }
          } catch (err) {
            console.error(`Không đọc được file: ${uriString}`, err);
          }
        }
        break;
      }
      default:
        break;
    }
  });
  panel.onDidDispose(() => {
    setCurrentPanel(undefined);
  });
  //gửi dữ liệu ban đầu
  sendCurentFileToPanel(panel, currentCode, currentFileName, relativePath);
  //theo dõi thay đổi focus editor
  vscode.window.onDidChangeActiveTextEditor(() => {
    updateEditorContent();
  });
  vscode.window.onDidChangeTextEditorSelection(() => {
    updateEditorContent();
  });
}

function sendCurentFileToPanel(
  panel: vscode.WebviewPanel,
  code: string,
  fileName: string,
  selectedCode?: string,
  selectionStart?: number,
  selectionEnd?: number,
  selectionStartCharacter?: number,
  selectionEndCharacter?: number,
  relativePath?: string
) {
  //console.log("changeee", fileName, relativePath, selectionStart);

  panel.webview.postMessage({
    type: "update",
    code,
    fileName,
    selectedCode,
    selectionStart,
    selectionEnd,
    selectionStartCharacter,
    selectionEndCharacter,
    relativePath,
  });
}

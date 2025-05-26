import * as vscode from "vscode";
import { getChatHtml } from "../panels/chatPanel";
import { requestPrompt } from "./function/requestPrompt";
import { handleGotoSelection } from "./function/goToSelection";
import { currentPanel, setCurrentPanel } from "../panels/panelState";

let currentCode: string = "";
let currentFileName: string = "";

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
    currentPanel.reveal();
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    "chatWithAI",
    "Chat with AI",
    vscode.ViewColumn.Beside,
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
        console.log("gotoSelection", message);
        await handleGotoSelection(message);
        break;
      case "sendPromptToModel": {
        // Gửi prompt đến model
        await requestPrompt(message, panel);
        break;
      }
      case "attachFile": {
        const files = await vscode.workspace.findFiles(
          "**/*",
          "**/node_modules/**"
        );
        const items = files.map((uri) => ({
          label: vscode.workspace.asRelativePath(uri),
          uri,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: "Tìm và chọn file context để đính kèm",
        });
        if (picked) {
          const fileUri = picked.uri;
          const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
          const content = (
            await vscode.workspace.fs.readFile(fileUri)
          ).toString();
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
          const relativePath = workspaceFolder
            ? vscode.workspace.asRelativePath(fileUri)
            : fileUri.fsPath;
          panel.webview.postMessage({
            type: "fileAttached",
            fileName,
            relativePath,
            content,
          });
        }
        break;
      }
      default:
        // Có thể xử lý các loại message khác ở đây nếu cần
        break;
    }
  });
  panel.onDidDispose(() => {
    setCurrentPanel(undefined);
  });
  //gửi dữ liệu ban đầu
  sendCurentFileToPanel(panel, currentCode, currentFileName);
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
  // console.log("changeee", fileName, selectionStart);
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

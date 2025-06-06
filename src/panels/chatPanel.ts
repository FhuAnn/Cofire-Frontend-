import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function getChatHtml(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
): string {
  const webviewFolder = vscode.Uri.joinPath(
    context.extensionUri,
    "src",
    "panels",
    "webview"
  );

  const htmlPath = vscode.Uri.joinPath(webviewFolder, "chat.html");
  const htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "main.js")
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "chat.css")
  );

  const iconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "assets")
  );
  const sendIconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "assets", "send.svg")
  );

  const dropdownIconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "assets", "chevron-down-arrow.svg")
  );

  const toggleFileIconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "assets", "eye-empty.svg")
  );

  return htmlContent
    .replace("{{styleUri}}", styleUri.toString())
    .replace("{{scriptUri}}", scriptUri.toString())
    .replace("{{iconUri}}", iconUri.toString())
    .replace("{{sendIconUri}}", sendIconUri.toString())
    .replace("{{dropdownIconUri}}", dropdownIconUri.toString())
    .replace("{{toggleFileIconUri}}", toggleFileIconUri.toString());
}

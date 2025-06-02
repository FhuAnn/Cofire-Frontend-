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
    vscode.Uri.joinPath(webviewFolder, "chat.js")
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(webviewFolder, "chat.css")
  );

  return htmlContent
    .replace("{{styleUri}}", styleUri.toString())
    .replace("{{scriptUri}}", scriptUri.toString());
}

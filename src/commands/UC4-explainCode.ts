import * as vscode from "vscode";
import { callExplainCodeAI } from "../utils/apis";

export function registerExplainCodeCommand() {
  return vscode.commands.registerCommand("cofire.explainCode", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return ;}

    const selection = editor.selection;
    const code = editor.document.getText(selection).trim();
    const language = editor.document.languageId;

    if (!code) {
      vscode.window.showInformationMessage(
        "Please select some code to explain."
      );
      return;
    }

    const explanation = await callExplainCodeAI(code, language);
    if (explanation) {
      vscode.window.showInformationMessage("📘 Code explained below:");
      const doc = await vscode.workspace.openTextDocument({
        content: explanation,
        language: "markdown",
      });
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    } else {
      vscode.window.showErrorMessage("Could not explain code.");
    }
  });
}

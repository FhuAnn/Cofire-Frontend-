import * as vscode from "vscode";
import { callGenerateCodeFromPrompt } from "../utils/apis";

export function registerGenerateCodeFromPromptCommand() {
  return vscode.commands.registerCommand(
    "extension.generateCodeFromPrompt",
    async () => {
      const prompt = await vscode.window.showInputBox({
        prompt:
          "Enter a prompt to generate code (e.g., 'Create REST API with Express')",
      });

      if (!prompt) return;

      try {
        const language =
          vscode.window.activeTextEditor?.document.languageId || "javascript";
        const result = await callGenerateCodeFromPrompt(prompt, language);

        const doc = await vscode.workspace.openTextDocument({
          content: result,
          language,
        });
        vscode.window.showTextDocument(doc);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          "Failed to generate code: " + error.message
        );
      }
    }
  );
}

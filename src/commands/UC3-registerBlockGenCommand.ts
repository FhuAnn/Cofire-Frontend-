import * as vscode from "vscode";

export function registerBlockGenCommand() {
  return vscode.commands.registerCommand("ai.generateBlock", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    const language = editor.document.languageId;

    const res = await fetch("http://localhost:3000/suggest-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        context: selectedText,
      }),
    });

    const { code } = (await res.json()) as { code: string };
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, code);
    });
  });
}

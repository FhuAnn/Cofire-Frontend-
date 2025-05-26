import * as vscode from "vscode";

export function insertGhostText(
  editor: vscode.TextEditor,
  position: vscode.Position,
  suggestion: string
) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText: suggestion,
      color: "gray",
      fontStyle: "italic",
      margin: "0 0 0 10px",
    },
  });

  editor.setDecorations(decorationType, [
    {
      range: new vscode.Range(position, position),
    },
  ]);

  setTimeout(() => {
    decorationType.dispose(); // Remove after a few seconds
  }, 5000);
}

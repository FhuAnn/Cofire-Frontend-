import * as vscode from "vscode";
import { insertGhostText } from "../utils/insertGhostText";
import { callGetAISuggestion } from "../utils/apis";
const debouncedGetSuggestion = debounce(callGetAISuggestion, 300);
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), wait);
    });
  };
}
let isInsertingFromAI = false;

export function recommmendCodeTyping() {
  return vscode.workspace.onDidChangeTextDocument((event) => {
    if (isInsertingFromAI) {
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      handleUserTyping(editor);
    }
  });
}
async function handleUserTyping(editor: vscode.TextEditor) {
  const position = editor.selection.active;
  const language = editor.document.languageId;
  const range = new vscode.Range(
    Math.max(position.line - 10, 0),
    0,
    position.line,
    position.character
  );
  const codeContext = editor.document.getText(range);

  const suggestion = await debouncedGetSuggestion(codeContext, language);
  if (suggestion) {
    isInsertingFromAI = true;
    insertGhostText(editor, position, suggestion);
    setTimeout(() => (isInsertingFromAI = false), 300);
  }
}

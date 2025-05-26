import * as vscode from "vscode";

export let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function setCurrentPanel(panel: vscode.WebviewPanel | undefined) {
  currentPanel = panel;
}

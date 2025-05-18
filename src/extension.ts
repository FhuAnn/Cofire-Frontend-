import * as vscode from "vscode";
import axios from "axios";
import { registerCompletionProvider } from "./providers/commandProvider";
import { registerSuggestCodeCommand } from "./commands/suggestCodeCommand";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    registerCompletionProvider(),
    registerSuggestCodeCommand()
  );
}

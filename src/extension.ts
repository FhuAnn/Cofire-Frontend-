import * as vscode from "vscode";
import { checkBackendStatus } from "./utils/apis";
import { recommmendCodeTyping } from "./commands/recommendCodeTyping";
import { registerInlineSuggestionProvider } from "./commands/suggestCodeCommand";
import { registerBlockGenCommand } from "./commands/registerBlockGenCommand";
import { registerExplainCodeCommand } from "./commands/explainCode";
export function activate(context: vscode.ExtensionContext) {
  checkBackendStatusStart();
  context.subscriptions.push(
    recommmendCodeTyping(),
    registerInlineSuggestionProvider(),
    registerBlockGenCommand(),
    registerExplainCodeCommand()
  );
}

async function checkBackendStatusStart() {
  try {
    const result = await checkBackendStatus();
    console.log(result);
    if (result.status === "ready") {
      vscode.window.showInformationMessage("✅ Cofire đã sẵn sàng!");
    } else {
      vscode.window.showWarningMessage("⚠️ Cofire chưa sẵn sàng.");
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `❌ Không thể kết nối Backend: ${error.message}`
    );
  }
}

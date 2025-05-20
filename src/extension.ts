import * as vscode from "vscode";
import { checkBackendStatus } from "./utils/apis";
import { recommmendCodeTyping } from "./commands/UC2-complementContinousCodeTyping";
import { registerBlockGenCommand } from "./commands/UC3-registerBlockGenCommand";
import { registerExplainCodeCommand } from "./commands/UC4-explainCode";
import { registerSuggestCodeCommand } from "./commands/UC5-controlToPrompt";
import { openAIChatPanel } from "./chat/UC6-aiChat";
import { ChatViewProvider } from "./chat/webview/chat-view-controller";
export function activate(context: vscode.ExtensionContext) {
  const chatViewProvider = new ChatViewProvider(context.extensionUri,context)
  checkBackendStatusStart();
  context.subscriptions.push(
    recommmendCodeTyping(),
    registerBlockGenCommand(),
    registerExplainCodeCommand(),
    registerSuggestCodeCommand(),
    vscode.commands.registerCommand("cofire.chatWithAI", () =>
      openAIChatPanel(context)
    ),
    vscode.commands.registerCommand("cofire.chatWithAIver2",()=>chatViewProvider.createOrShowPanel)
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

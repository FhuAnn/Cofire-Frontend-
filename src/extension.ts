import * as vscode from "vscode";
import { checkBackendStatus } from "./utils/apis";
import { recommmendCodeTyping } from "./commands/UC2-complementContinousCodeTyping";
import { registerBlockGenCommand } from "./commands/UC3-registerBlockGenCommand";
import { registerExplainCodeCommand } from "./commands/UC4-explainCode";
import { registerSuggestCodeCommand } from "./commands/UC5-controlToPrompt";
import { openAIChatPanel } from "./chat/UC6-aiChat";
import { inlineCompletionProvider } from "./providers/UC2temp-commandProvider";
export function activate(context: vscode.ExtensionContext) {
  checkBackendStatusStart();
  context.subscriptions.push(
    // recommmendCodeTyping(),
    registerBlockGenCommand(),
    registerExplainCodeCommand(),
    registerSuggestCodeCommand(),
    vscode.commands.registerCommand("cofire.chatWithAI", () =>
      openAIChatPanel(context)
    ),
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      inlineCompletionProvider
    )
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

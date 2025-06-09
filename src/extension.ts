import * as vscode from "vscode";
import { checkBackendStatus } from "./utils/apis";
import { registerBlockGenCommand } from "./commands/UC3-registerBlockGenCommand";
import { registerExplainCodeCommand } from "./commands/UC4-explainCode";
import { registerSuggestCodeCommand } from "./commands/UC5-controlToPrompt";
import { openAIChatPanel } from "./chat/UC6-aiChat";
import { inlineCompletionProvider } from "./providers/UC2temp-commandProvider";
import { addFileToChat } from "./chat/UC6-1-addFileToChat";
import { addSelectionToChat } from "./chat/UC6-2-addSelectionToChat";

export function activate(context: vscode.ExtensionContext) {
  console.log("starting cofire extension...");
  checkBackendStatusStart();

  context.subscriptions.push(
    registerBlockGenCommand(),
    registerExplainCodeCommand(),
    vscode.commands.registerCommand(
      "cofire.enterPromtToGetCode",
      registerSuggestCodeCommand
    ),
    vscode.commands.registerCommand("cofire.chatWithAI", () =>
      openAIChatPanel(context)
    ),

    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      inlineCompletionProvider
    ),
    vscode.commands.registerCommand("cofire.addFileToChat", (fileUri) =>
      addFileToChat(context, fileUri)
    ),
    vscode.commands.registerCommand("cofire.addSelectionToChat", () =>
      addSelectionToChat(context)
    )
  );
}

async function checkBackendStatusStart() {
  try {
    const result = await checkBackendStatus();
    // console.log(result);
    if (result.status === "ready") {
      vscode.window.showInformationMessage("✅ Cofire đã sẵn sàng!");
    } else {
      vscode.window.showWarningMessage(`⚠️ Cofire chưa sẵn sàng. Lỗi : ${result.error}`);
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `❌ Không thể kết nối Backend: ${error.message}`
    );
  }
}

import * as vscode from "vscode";
import * as path from "path";

import { getChatHtml } from "../panels/chatPanel";
import { requestPrompt } from "./function/requestPrompt";
import { handleGotoSelection } from "./function/goToSelection";
import { currentPanel, setCurrentPanel } from "../panels/panelState";
import { FileToSend, MessageInConversation } from "../types";
import { conversationController } from "./function/ConversationController";
import {
  callAPICheckAndGetLoginStatus,
  callAPIDeleteConversation,
  callAPIGetConversationDetail,
  callAPIGetConversationHistory,
  checkAPIKey,
  fetchModelFromProvider,
  updateModels,
} from "../utils/apis";
import listenForToken from "./function/listenForToken";

let currentCode: string = "";
let currentFileName: string = "";
let relativePath: string = "";

export async function openAIChatPanel(context: vscode.ExtensionContext) {
  const tokenPromise = listenForToken();

  const secretStorage = context.secrets;
  const updateEditorContent = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      //Lấy selection nếu có
      const selection = editor.selection;
      const fullPath = editor.document.fileName;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      const relativePath = workspaceFolder
        ? vscode.workspace.asRelativePath(fullPath)
        : fullPath;

      let selectedCode = "";
      let selectionStart = 0;
      let selectionEnd = 0;
      let selectionStartCharacter = 0;
      let selectionEndCharacter = 0;
      currentFileName =
        editor.document.fileName.split(/[/\\]/).pop() ?? "No content";

      if (!selection.isEmpty) {
        selectedCode = editor.document.getText(selection);
        selectionStart = selection.start.line + 1; // dòng bắt đầu (1-based)
        selectionEnd = selection.end.line + 1; // dòng kết thúc (1-based)
        selectionStartCharacter = selection.start.character;
        selectionEndCharacter = selection.end.character;
        currentCode = "";
      } else {
        currentCode = editor.document.getText();
      }
      //gửi toàn bộ tới panel
      if (currentPanel) {
        sendCurentFileToPanel(
          currentPanel,
          currentFileName,
          relativePath,
          currentCode,
          selectedCode,
          selectionStart,
          selectionEnd,
          selectionStartCharacter,
          selectionEndCharacter
        );
      }
      currentCode = "";
      currentFileName = "";
    }
  };
  updateEditorContent();
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Two, true);
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    "chatWithAI",
    "Cofire - AI assistant",
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.iconPath = {
    light: vscode.Uri.file(
      path.join(context.extensionPath, "images", "icon.png")
    ),
    dark: vscode.Uri.file(
      path.join(context.extensionPath, "images", "icon.png")
    ),
  };

  setCurrentPanel(panel);

  panel.webview.html = getChatHtml(panel, context);

  //Check login status
  const userId = await context.secrets.get("userId");
  if (userId) {
    conversationController.setUserId(userId);
    panel.webview.postMessage({
      type: "loginSuccess",
    });
  } else {
    panel.webview.postMessage({
      type: "notLoggedInYest",
    });
  }

  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.type) {
      case "showOtherProviders":
        // Danh sách các nhà cung cấp hợp lệ
        const validProviders = ["Gemini", "OpenAI", "Anthropic"];
        const resultProvider = await vscode.window.showQuickPick(
          ["Gemini", "OpenAI", "Anthropic"],
          {
            placeHolder: "Select a provider",
            canPickMany: false,
          }
        );
        //console.log("check result provider");

        if (!resultProvider || !validProviders.includes(resultProvider)) {
          vscode.window.showErrorMessage(
            "Invalid provider selected. Please choose " + validProviders
          );
          return;
        }
        // Hiển thị thông báo loading khi kiểm tra API Key và lấy danh sách mô hình
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification, // Hiển thị trong khu vực thông báo
            title: `Preparing ${resultProvider}...`, // Tiêu đề thông báo
            cancellable: false, // Không cho phép hủy
          },
          async (progress) => {
            progress.report({ message: "Checking API Key..." });
            const existingKey = await secretStorage.get(resultProvider);
            let keytoUse = existingKey;
            if (existingKey) {
              // Nếu có API Key, hỏi xem người dùng có muốn xóa hay sử dụng lại
              const action = await vscode.window.showQuickPick(
                [
                  "Use existing API Key",
                  "Enter new API Key",
                  "Delete existing API Key",
                ],
                {
                  placeHolder: `API Key found for ${resultProvider}. What do you want to do?`,
                  canPickMany: false,
                }
              );

              if (!action) {
                vscode.window.showInformationMessage("No action selected.");
                return;
              }

              if (action === "Delete existing API Key") {
                // Xóa API Key khỏi secretStorage
                await secretStorage.delete(resultProvider);
                vscode.window.showInformationMessage(
                  `API Key for ${resultProvider} has been deleted.`
                );

                // Yêu cầu nhập API Key mới
                const resultAPIKey = await vscode.window.showInputBox({
                  placeHolder: "Enter API Key",
                  prompt: `Enter API Key for ${resultProvider}`,
                  password: true,
                });

                if (!resultAPIKey) {
                  vscode.window.showInformationMessage("No API Key provided.");
                  return;
                }

                // Kiểm tra API Key hợp lệ
                const isValidKey = await checkAPIKey(
                  resultProvider,
                  resultAPIKey
                );
                if (!isValidKey) {
                  vscode.window.showErrorMessage(
                    "Invalid API Key. Please try again."
                  );
                  return;
                }

                await secretStorage.store(resultProvider, resultAPIKey);
                keytoUse = resultAPIKey;
              } else if (action === "Enter new API Key") {
                // Nhập API Key mới
                const resultAPIKey = await vscode.window.showInputBox({
                  placeHolder: "Enter API Key",
                  prompt: `Enter API Key for ${resultProvider}`,
                  password: true,
                });

                if (!resultAPIKey) {
                  vscode.window.showInformationMessage("No API Key provided.");
                  return;
                }

                // Kiểm tra API Key hợp lệ
                const isValidKey = await checkAPIKey(
                  resultProvider,
                  resultAPIKey
                );
                if (!isValidKey) {
                  vscode.window.showErrorMessage(
                    "Invalid API Key. Please try again."
                  );
                  return;
                }

                await secretStorage.store(resultProvider, resultAPIKey);
                keytoUse = resultAPIKey;
              }
              // Nếu chọn "Use existing API Key", keytoUse vẫn là existingKey
            } else {
              // Không có API Key, yêu cầu nhập mới
              const resultAPIKey = await vscode.window.showInputBox({
                placeHolder: "Enter API Key",
                prompt: `Enter API Key for ${resultProvider}`,
                password: true,
              });

              if (!resultAPIKey) {
                vscode.window.showInformationMessage("No API Key provided.");
                return;
              }
              progress.report({ message: "Validating API Key..." });
              // Kiểm tra API Key hợp lệ
              const isValidKey = await checkAPIKey(
                resultProvider,
                resultAPIKey
              );
              if (!isValidKey) {
                vscode.window.showErrorMessage(
                  "Invalid API Key. Please try again."
                );
                return;
              }

              await secretStorage.store(resultProvider, resultAPIKey);
              keytoUse = resultAPIKey;
            }
            progress.report({ message: "Fetching models..." });

            // fetch Models from selected provider
            const modelOptionsResult = await fetchModelFromProvider(
              resultProvider,
              keytoUse
            );

            if (!modelOptionsResult || modelOptionsResult.length === 0) {
              vscode.window.showInformationMessage(
                "No model lists found for the selected provider."
              );
              return;
            }

            const labels = modelOptionsResult.map(
              (model: { label: string }) => model.label
            );
            progress.report({ message: "Ready!" });
            // Hiển thị danh sách các mô hình AI
            const selectedModel = await vscode.window.showQuickPick(labels, {
              placeHolder: `Select a model from ${resultProvider}`,
              canPickMany: false,
            });
            if (!selectedModel) {
              6;
              vscode.window.showInformationMessage("No model selected.");
              return;
            }

            // Gửi thông tin nhà cung cấp và mô hình đã chọn về phía client
            const result = modelOptionsResult.find(
              (option: { value: string; label: string }) =>
                selectedModel.includes(option.label)
            );

            // Gửi thông tin nhà cung cấp đã chọn về phía client
            panel.webview.postMessage({
              type: "newModelSelected",
              modelData: result,
            });
          }
        );
        break;
      case "gotoSymbol":
        const { file, mention } = message;

        console.log("Cofire-fe gotoSymbol ::: ", message);

        try {
          // Tạo URI từ đường dẫn tương đối
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders) {
            vscode.window.showErrorMessage("Không tìm thấy workspace đang mở.");
            return;
          }

          const rootUri = workspaceFolders[0].uri;
          const fileUri = vscode.Uri.joinPath(rootUri, file);

          // Mở file ở bên trái (ViewColumn.One)
          const document = await vscode.workspace.openTextDocument(fileUri);
          const editor = await vscode.window.showTextDocument(
            document,
            vscode.ViewColumn.One
          );

          // Tìm vị trí đầu tiên của "mention"
          const text = document.getText();

          console.log("Text content:", text);

          const index = text.indexOf(mention);
          if (index === -1) {
            vscode.window.showWarningMessage(
              `Không tìm thấy "${mention}" trong file ${file}`
            );
            return;
          }

          const startPos = document.positionAt(index);
          const endPos = startPos.translate(0, mention.length);
          const range = new vscode.Range(startPos, endPos);

          // Highlight và scroll đến vị trí
          editor.selection = new vscode.Selection(startPos, endPos);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Lỗi khi mở file hoặc tìm "${mention}": ${error}`
          );
          console.error("gotoSymbol error:", error);
        }

        break;
      case "modelSelected":
        console.log("get modelSelected from aiChat", message);
        const isUserModel = message.isUserModel;

        const model = message.model;
        let provider: string | undefined;
        if (model.startsWith("gemini")) {
          provider = "Gemini";
        } else if (model.startsWith("gpt")) {
          provider = "OpenAI";
        } else if (model.startsWith("claude")) {
          provider = "Anthropic";
        }

        if (!provider) {
          vscode.window.showErrorMessage(
            "Unknown provider for selected model."
          );
          return;
        }
        const apikey = await secretStorage.get(provider);

        if (isUserModel) {
          await updateModels(model, apikey, provider);
        } else {
          await updateModels(model, "", provider);
        }
        break;
      case "gotoSelection":
        //console.log("gotoSelection", message);
        await handleGotoSelection(message);
        break;
      case "sendPromptToModel": {
        console.log("sendPromptToModel", message);
        let filesToSend: FileToSend[] = [];
        //Gộp các loại selection và file cần gửi.
        for (const f of message.files) {
          //trường hợp người dùng gửi folder
          if (f.folderUri) {
            //console.log("f.code");
            //trường hợp người dùng gửi folder
            const folderUri = vscode.Uri.parse(f.folderUri);
            const files = await vscode.workspace.findFiles(
              new vscode.RelativePattern(folderUri, "**/*"),
              "**/node_modules/**"
            );
            for (const fileUri of files) {
              const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;
              const content = (
                await vscode.workspace.fs.readFile(fileUri)
              ).toString();
              const workspaceFolder =
                vscode.workspace.getWorkspaceFolder(fileUri);
              const relativePath = workspaceFolder
                ? vscode.workspace.asRelativePath(fileUri)
                : fileUri.fsPath;
              console.log("File to send:", fileName, relativePath, content);
              filesToSend.push({
                fileName,
                relativePath,
                code: content,
              });
            }
          } else {
            //push file or selection
            filesToSend.push(f);
          }
        }
        //console.log("Đoạn chat hiện tại chuẩn bị", filesToSend);
        // Lấy nội dung của file hiện tại
        const newChatToSend: MessageInConversation = {
          role: "user",
          content: message.prompt,
          attachedFiles: filesToSend,
          loadingId: message.loadingId,
        };
        // await requestPrompt(newChatToSend, panel);
        await requestPrompt(newChatToSend, panel, message.model);
        break;
      }
      case "attachFile": {
        // Lấy tất cả file và folder trong workspace (trừ node_modules)
        const filesAndFolders = await vscode.workspace.findFiles(
          "**",
          "**/node_modules/**"
        );
        const items = filesAndFolders.map((uri) => ({
          label: vscode.workspace.asRelativePath(uri),
          uri,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: "Chọn file hoặc thư mục context để đính kèm",
        });
        if (picked) {
          const fileUri = picked.uri;

          const stat = await vscode.workspace.fs.stat(fileUri);
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
          const relativePath = workspaceFolder
            ? vscode.workspace.asRelativePath(fileUri)
            : fileUri.fsPath;

          if (stat.type === vscode.FileType.Directory) {
            const bytes = await vscode.workspace.fs.readFile(fileUri);
            const content = new TextDecoder("utf-8").decode(bytes);
            panel.webview.postMessage({
              type: "folderAttached",
              folderName: fileUri.path.split("/").pop() || fileUri.fsPath,
              relativePath,
              folderUri: fileUri.toString(),
              content,
            });
          } else {
            const fileName = fileUri.path.split("/").pop() || fileUri.fsPath;

            const content = (
              await vscode.workspace.fs.readFile(fileUri)
            ).toString();
            panel.webview.postMessage({
              type: "fileAttached",
              fileName,
              relativePath,
              content,
            });
          }
        }
        break;
      }
      case "filesDropped": {
        const uris: string[] = message.uris;
        console.log("Files dropped:", uris);

        for (const uriString of uris) {
          try {
            const fileUri = vscode.Uri.parse(uriString);
            // Lấy thông tin file (stat, workspace folder, relativePath)
            const stat = await vscode.workspace.fs.stat(fileUri);
            const workspaceFolder =
              vscode.workspace.getWorkspaceFolder(fileUri);
            const relativePath = workspaceFolder
              ? vscode.workspace.asRelativePath(fileUri)
              : fileUri.fsPath;
            const fileName = path.basename(fileUri.fsPath);

            if (stat.type === vscode.FileType.Directory) {
              // Nếu vô tình kéo thư mục
              panel.webview.postMessage({
                type: "folderAttached",
                folderName: fileName,
                relativePath,
                folderUri: fileUri.toString(),
              });
            } else {
              // Nếu là file, đọc nội dung và gửi về như attachFile
              const bytes = await vscode.workspace.fs.readFile(fileUri);
              const content = new TextDecoder("utf-8").decode(bytes);
              console.log("prepare attach file");
              panel.webview.postMessage({
                type: "fileAttached",
                fileName,
                relativePath,
                content,
              });
            }
          } catch (err) {
            console.error(`Không đọc được file: ${uriString}`, err);
          }
        }
        break;
      }
      case "showHistory": {
        const userId = await context.secrets.get("userId");
        if (!userId) {
          vscode.window.showErrorMessage(
            "Bạn cần đăng nhập để xem lịch sử trò chuyện."
          );
          return;
        }
        const { conversations, message } = await callAPIGetConversationHistory(
          userId
        );
        if (conversations.length === 0) {
          vscode.window.showInformationMessage(
            "No conversation history found. Please start a new chat."
          );
          return;
        }
        // Hiển thị danh sách để chọn
        const pickItems = conversations.map((conv: any) => ({
          label: conv.title || `Cuộc trò chuyện ${conv._id}`,
          description: conv.updatedAt
            ? `Cập nhật: ${new Date(conv.updatedAt).toLocaleString()}`
            : "",
          conversationId: conv._id,
        }));
        const picked = await vscode.window.showQuickPick(pickItems, {
          placeHolder: "Chọn một cuộc trò chuyện để xem chi tiết",
        });

        if (!picked) return;

        // Hiển thị lựa chọn tiếp theo
        const action = await vscode.window.showQuickPick(
          [
            { label: "👁 Xem cuộc trò chuyện", action: "view" },
            { label: "🗑 Xóa cuộc trò chuyện này", action: "delete" },
          ],
          { placeHolder: `Bạn muốn làm gì với "${picked.label}"?` }
        );

        if (!action) return;

        if (action.action === "delete") {
          await callAPIDeleteConversation(picked.conversationId);
          vscode.window.showInformationMessage(
            `Deleted conversation-${picked.conversationId}`
          );

          conversationController.initializeNewConversation();
          const userId = await context.secrets.get("userId");
          if (userId) conversationController.setUserId(userId);
          panel.webview.postMessage({
            type: "deleteConversation",
          });
        } else if (action.action === "view") {
          const { messagesInConversation } = await callAPIGetConversationDetail(
            picked.conversationId
          );
          const pickedConversation = conversations.find(
            (conv: any) => conv._id === picked.conversationId
          );
          if (pickedConversation)
            conversationController.setConversation(pickedConversation);

          panel.webview.postMessage({
            type: "showConversationDetail",
            conversationId: picked.conversationId,
            messagesInConversation,
          });
        }

        break;
      }
      case "newChat": {
        //const userID = await context.secrets.get("userID");
        conversationController.initializeNewConversation();
        const userId = await context.secrets.get("userId");
        if (userId) conversationController.setUserId(userId);
        break;
      }
      case "github-login":
        const githubAuthUrl = "http://localhost:5000/api/v1/login/auth/github";
        vscode.env.openExternal(vscode.Uri.parse(githubAuthUrl));
        panel.webview.postMessage({
          type: "showProcessLogin",
        });
        const token = await tokenPromise;
        if (token) await secretStorage.store("accessToken", token.toString());
        break;
      case "fetchLoginStatus":
        const accessToken = await secretStorage.get("accessToken");
        const { success, userId } = await callAPICheckAndGetLoginStatus(
          accessToken
        );
        if (success && userId) {
          await secretStorage.store("userId", userId);
          conversationController.setUserId(userId);
          vscode.window.showInformationMessage("Login successfully!");
          panel.webview.postMessage({
            type: "loginSuccess",
          });
        } else {
          vscode.window.showInformationMessage("Authentication Failed!");
          panel.webview.postMessage({
            type: "notLoggedInYest",
          });
        }
        break;
      default:
        break;
    }
  });
  panel.onDidDispose(() => {
    setCurrentPanel(undefined);
  });
  //gửi dữ liệu ban đầu
  sendCurentFileToPanel(panel, currentFileName, relativePath, currentCode);
  //theo dõi thay đổi focus editor
  vscode.window.onDidChangeActiveTextEditor(() => {
    updateEditorContent();
  });
  vscode.window.onDidChangeTextEditorSelection(() => {
    updateEditorContent();
  });
}

function sendCurentFileToPanel(
  panel: vscode.WebviewPanel,
  fileName: string,
  relativePath: string,
  code: string,
  selectedCode?: string,
  selectionStart?: number,
  selectionEnd?: number,
  selectionStartCharacter?: number,
  selectionEndCharacter?: number
) {
  // console.log("changeee", fileName, relativePath, selectionStart);
  if (code) {
    //nếu người dùng chọn cả file
    panel.webview.postMessage({
      type: "update",
      fileName,
      code,
      relativePath,
    });
  } else {
    // nếu người dùng chọn bằng selection
    panel.webview.postMessage({
      type: "update",
      fileName,
      selectedCode,
      selectionStart,
      selectionEnd,
      selectionStartCharacter,
      selectionEndCharacter,
      relativePath,
    });
  }
}

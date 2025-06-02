import * as vscode from "vscode";
export async function handleGotoSelection(message: any) {
  const {
    relativePath,
    name,
    selectionStart,
    selectionEnd,
    selectionStartCharacter,
    selectionEndCharacter,
    typeAttached,
    folderUri,
  } = message;
  //console.log("gotoSelection", message)
  // Nếu là folder thì mở folder trong Explorer
  if (typeAttached === "folder" || (!name && folderUri)) {
    const uri = folderUri
      ? vscode.Uri.parse(folderUri)
      : vscode.Uri.file(relativePath);
    await vscode.commands.executeCommand("revealInExplorer", uri);
    //console.log("it is folder, open in explorer");
    return;
  }
  // console.log("it is not folder, open in explorer", typeAttached);

  // Nếu là file thì nhảy tới selection như cũ
  const files = await vscode.workspace.findFiles(relativePath);
  if (files.length > 0) { 
    const doc = await vscode.workspace.openTextDocument(files[0]);
    const editor = await vscode.window.showTextDocument(
      doc,
      vscode.ViewColumn.One
    );
    const safeLine = (line: number | undefined) => Math.max(0, (line ?? 1) - 1);

    // Chuyển selection về 0-based
    const start = new vscode.Position(
      safeLine(selectionStart),
      selectionStartCharacter ?? 0
    );
    const end = new vscode.Position(
      safeLine(selectionEnd),
      selectionEndCharacter ?? 0
    );
    editor.selection = new vscode.Selection(start, end);
    editor.revealRange(
      new vscode.Range(start, end),
      vscode.TextEditorRevealType.InCenter
    );
  } else {
    vscode.window.showWarningMessage(`Không tìm thấy file: ${name}`);
  }
}

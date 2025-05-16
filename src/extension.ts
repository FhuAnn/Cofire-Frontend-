import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCompletionItemProvider(
        ['javascript', 'typescript', 'python', 'csharp'],
        {
            async provideCompletionItems(document, position) {
                const textBeforeCursor = document.getText(new vscode.Range(
                    new vscode.Position(Math.max(0, position.line - 10), 0),
                    position
                ));

                const payload = {
                    language: document.languageId,
                    context: textBeforeCursor
                };

                try {
                    const res = await axios.post('http://localhost:5000/suggest', payload);
                    const suggestions = res.data.suggestions || [];

                    return suggestions.map((item: any) => {
                        const completion = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Snippet);
                        completion.insertText = item.insertText;
                        completion.detail = item.detail;
                        return completion;
                    });
                } catch (err) {
                    vscode.window.showErrorMessage('AI Suggestion Error');
                    return [];
                }
            }
        },
        '.' // Trigger sau dấu `.`
    );

    context.subscriptions.push(provider);
}

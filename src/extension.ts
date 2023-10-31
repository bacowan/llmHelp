import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('llmhelp', () => {
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'llmHelp', // Identifies the type of the webview. Used internally
				'LLM Help', // Title of the panel displayed to the user
				vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
				{
					// Only allow the webview to access resources in our extension's media directory
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'web')],
					enableScripts: true
				}
			);
			

			function loadExternalFile(oldFileName: string, html: string): string {
				const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', oldFileName);
				return html.replace(oldFileName, panel.webview.asWebviewUri(onDiskPath).toString());
			}

			/*const editor = vscode.window.activeTextEditor;
			if (editor) {
				const code = editor.document.getText();
				vscode.window.showInformationMessage('Code retrieved from the active editor:\n' + code);
			} else {
				vscode.window.showInformationMessage('No active text editor found.');
			}*/

			const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', 'index.html');
			const pathUri = panel.webview.asWebviewUri(onDiskPath);
			let html = fs.readFileSync(pathUri.fsPath,'utf8');
			html = loadExternalFile("index.js", html);
			html = loadExternalFile("styles.css", html);
			panel.webview.html = html;
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

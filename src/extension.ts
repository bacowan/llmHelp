import * as vscode from 'vscode';
const fs = require('fs').promises;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('llmhelp', async () => {
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

			/*const editor = vscode.window.activeTextEditor;
			if (editor) {
				const code = editor.document.getText();
				vscode.window.showInformationMessage('Code retrieved from the active editor:\n' + code);
			} else {
				vscode.window.showInformationMessage('No active text editor found.');
			}*/

			await loadHtml(context, panel);
			await initializeBot(context, panel);
		})
	);
}

			
function loadExternalFile(oldFileName: string, html: string, context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
	const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', oldFileName);
	return html.replace(oldFileName, panel.webview.asWebviewUri(onDiskPath).toString());
}

async function loadHtml(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
	const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', 'index.html');
	const pathUri = panel.webview.asWebviewUri(onDiskPath);
	let html = await fs.readFile(pathUri.fsPath,'utf8');
	html = loadExternalFile("index.js", html, context, panel);
	html = loadExternalFile("styles.css", html, context, panel);
	panel.webview.html = html;
}

async function initializeBot(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
	try {
		const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'config/config.json');
		const pathUri = panel.webview.asWebviewUri(onDiskPath);
		const data = await fs.readFile(pathUri.fsPath, 'utf8');
		panel.webview.postMessage({ command: "loadConfig", data: data });
	} catch (err) {
		// TODO: Error handling
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}

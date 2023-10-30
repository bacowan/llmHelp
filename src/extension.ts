import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('llmhelp', () => {
		  // Create and show a new webview
		  const panel = vscode.window.createWebviewPanel(
			'llmHelp', // Identifies the type of the webview. Used internally
			'LLM Help', // Title of the panel displayed to the user
			vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		  );
		})
	  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

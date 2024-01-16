import * as vscode from 'vscode';
import Framework from './framework';

import winston from 'winston';
var path = require('path');
const fs = require('fs').promises;
const framework : Framework = new Framework();

const problemsPath = 'config/problems.json';
const configPath = 'config/config.json';
const chatGptModel = 'gpt-3.5-turbo';
let logger : winston.Logger;

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

			initializeLogging(panel, context);

			const editor = vscode.window.activeTextEditor;

			if (editor !== null && editor !== undefined) {
				initializeHandlers(context, panel, editor);
			}
			else {
				//TODO: Error handling
			}
			await loadHtml(context, panel);
		})
	);
}

function padZero(num: number) {
    return num < 10 ? `0${num}` : num;
}

async function initializeLogging(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
	const fullConfigPath = vscode.Uri.joinPath(context.extensionUri, configPath);
	const pathUri = panel.webview.asWebviewUri(fullConfigPath);
	const config = await fs.readFile(pathUri.fsPath, 'utf8');
	const configAsJson = JSON.parse(config);
	const logFolderPath = configAsJson.log_folder_path as string;
	const currentDateTime = new Date();
	const logFileName = `log_${currentDateTime.getFullYear()}-${padZero(currentDateTime.getMonth() + 1)}-${padZero(currentDateTime.getDate())}_${padZero(currentDateTime.getHours())}-${padZero(currentDateTime.getMinutes())}-${padZero(currentDateTime.getSeconds())}.log`;
	const logFilePath = path.join(logFolderPath, logFileName);

	logger = winston.createLogger({
		format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
		transports: [
			new winston.transports.File({ filename: logFilePath })
		]
	});
	framework.setLogger(logger);
	logger.info("initialized");
}
			
function loadExternalFile(oldFileName: string, html: string, context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
	const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', oldFileName);
	return html.replace(oldFileName, panel.webview.asWebviewUri(onDiskPath).toString());
}

async function loadHtml(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
	const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'web', 'index.html');
	const pathUri = panel.webview.asWebviewUri(onDiskPath);
	let html = await fs.readFile(pathUri.fsPath, 'utf8');
	html = loadExternalFile("index.js", html, context, panel);
	html = loadExternalFile("styles.css", html, context, panel);
	panel.webview.html = html;
}

async function initializeBot(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
	try {
		const onDiskPath = vscode.Uri.joinPath(context.extensionUri, problemsPath);
		const pathUri = panel.webview.asWebviewUri(onDiskPath);
		const data = await fs.readFile(pathUri.fsPath, 'utf8');
		panel.webview.postMessage({ command: "loadConfig", data: data });
	} catch (err) {
		// TODO: Error handling
	}
}

function initializeHandlers(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, editor: vscode.TextEditor) {
	panel.webview.onDidReceiveMessage(
		async message => {
			try {
				switch (message.command) {
				case 'loaded':
					await initializeBot(context, panel);
					return;
				case 'initialize':
					const problem = message.data as { Description: string, Title: string };
					framework.initialize(problem, chatGptModel);
					panel.webview.postMessage({ command: "return" });
					return;
				case 'prompt':
					let response : string;
					try {
						const code = editor.document.getText();
						response = await framework.sendPrompt(message.data, code);
					}
					catch (e) {
						if (typeof e === "string") {
							response = e;
						} else if (e instanceof Error) {
							response = (e as Error).message;
						}
						else {
							response = (e as any)?.toString();
						}
						logger?.error(response);
						response = "Uh oh! Something went wrong: " + response;
					}
					panel.webview.postMessage({ command: "return", data: response });
					return;
				}
			}
			catch (e) {
				if (typeof e === "string") {
					logger?.error(e);
				} else if (e instanceof Error) {
					logger?.error(e.message);
				}
			}
		},
		undefined,
		context.subscriptions
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}





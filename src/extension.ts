import * as vscode from 'vscode';
import Framework from './framework';

import winston from 'winston';
var path = require('path');
const fs = require('fs').promises;
const framework : Framework = new Framework();

const problemsPath = 'problems/problems.json';
const langPath = 'config/lang.json';
const configPath = 'config/config.json';
let logger : winston.Logger;
let chatGptModel : string;
let userLanguage : "En" | "Jp";
let recommendedResponseRole : string | null;
let lang : { [key: string]: { [lang: string]: string } };
let useFramework : boolean = true;

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

			initializeConfig(panel, context);

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

async function initializeConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
	try {
		const fullConfigPath = vscode.Uri.joinPath(context.extensionUri, configPath);
		const pathUri = panel.webview.asWebviewUri(fullConfigPath);
		const config = await fs.readFile(pathUri.fsPath, 'utf8');
		const configAsJson = JSON.parse(config);
		chatGptModel = configAsJson.chat_gpt_model as string;
		userLanguage = configAsJson.user_language as "En" | "Jp";
		recommendedResponseRole = configAsJson.recommended_response_role as string | null;
		useFramework = configAsJson.use_framework as boolean;
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
	catch (err) {
		const hi = 0;
		// TODO: Error handling
	}
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
		const problemsOnDiskPath = vscode.Uri.joinPath(context.extensionUri, problemsPath);
		const problemsPathUri = panel.webview.asWebviewUri(problemsOnDiskPath);
		const problems = await fs.readFile(problemsPathUri.fsPath, 'utf8');

		const langOnDiskPath = vscode.Uri.joinPath(context.extensionUri, langPath);
		const langPathUri = panel.webview.asWebviewUri(langOnDiskPath);
		lang = JSON.parse(await fs.readFile(langPathUri.fsPath, 'utf8'));

		const data = {
			problems: JSON.parse(problems).problems,
			userLanguage: userLanguage,
			lang: lang
		};
		panel.webview.postMessage({ command: "loadConfig", data: data });
	} catch (err) {
		const x = 0;
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
					const problem = message.data as { Description: string, Title: string, RecommendedResponseRole: string | null };
					framework.initialize(problem, chatGptModel, userLanguage, lang, recommendedResponseRole, useFramework );
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





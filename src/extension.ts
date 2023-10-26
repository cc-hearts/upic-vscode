import * as vscode from 'vscode';
import * as path from 'path';
import { execSync } from 'child_process';

interface ImageMeta {
	originStr: string
	name: string
	imageName: string
}

function uploadWithUPic(imageList: Array<ImageMeta>) {
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path;
	if (rootPath) {
		return imageList.map((item) => {
			const _path = path.resolve(rootPath, item.imageName);
			const data = execSync(`/Applications/uPic.app/Contents/MacOS/uPic -u ${_path} -s`);
			const reg = /https.*$/gm;
			const uploadPathList = data.toString().match(reg);
			if (uploadPathList) {
				const [uploadPath] = uploadPathList;
				return {
					originStr: item.originStr,
					newStr: item.originStr.replace(/\(.*\)/, `(${uploadPath})`)
				};
			}
			return null;
		});
	}
	return [];
}

function textReplace(text: string, imageList: Array<{ originStr: string, newStr: string }>) {
	imageList.forEach((item) => {
		text = text.replace(item.originStr, item.newStr);
	});
	return text;
}
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('upic-vscode.pasteCommand', async () => {
		// 执行vscode原本的粘贴操作
		await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
		const text = await vscode.env.clipboard.readText();
		// 获取粘贴后的选择区域信息
		if (text) {
			return;
		}
		setTimeout(() => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				let selection = editor.selection;
				let lineNumber = selection.active.line;
				let lineText = editor.document.lineAt(lineNumber).text;
				const replaceImage = [] as Array<ImageMeta>;
				const reg = /\!\[(.*)\]\((.*)\)/g;
				const match = lineText.match(reg);
				match?.forEach(item => {
					const reg = /\!\[(.*)\]\((.*)\)/;
					const matcher = item.match(reg);
					if (matcher) {
						replaceImage.push({
							originStr: matcher[0],
							name: matcher[1],
							imageName: matcher[2]
						});
					}
				});

				const list = uploadWithUPic(replaceImage);
				if (Array.isArray(list) && list.length > 0) {
					const _data = list.filter(data => !!data) as Array<{ originStr: string, newStr: string }>;
					const text = textReplace(lineText, _data);
					const range = editor.document.lineAt(lineNumber).range;
					editor.edit(editBuilder => {
						editBuilder.replace(range, text);
					});
				}
			}
		}, 100);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

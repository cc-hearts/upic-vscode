import * as vscode from 'vscode';
import { basename, resolve, extname } from 'path';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, rm, access, constants, rename } from 'fs/promises';

interface ImageMeta {
	originStr: string
	name: string
	imageName: string
}

async function uploadWithUPic(imageList: Array<ImageMeta>) {
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path;
	if (rootPath) {
		const res = imageList.map(async (item) => {
			const _path = resolve(rootPath, item.imageName);
			const reFilename = resolve(rootPath, renameImage(item.imageName));
			try {
				await rename(_path, reFilename);
			} catch (e) {
				console.log('rename error: ', e);
			}
			const data = execSync(`/Applications/uPic.app/Contents/MacOS/uPic -u ${reFilename} -s`);
			console.log('command: ', `/Applications/uPic.app/Contents/MacOS/uPic -u ${reFilename} -s`);
			const reg = /http.*$/gm;
			const uploadPathList = data.toString().match(reg);
			console.log('data.toString(): ', data.toString());
			if (uploadPathList) {
				const [uploadPath] = uploadPathList;
				moveFile(resolve(rootPath, reFilename));
				return {
					originStr: item.originStr,
					newStr: item.originStr.replace(/\(.*\)/, `(${uploadPath})`)
				};
			}
			return null;
		});
		return Promise.all(res);
	}
	return [];
}

function textReplace(text: string, imageList: Array<{ originStr: string, newStr: string }>) {
	imageList.forEach((item) => {
		text = text.replace(item.originStr, item.newStr);
	});
	return text;
}

async function moveFile(filepath: string) {
	const MOVE_DIR_NAME = '.upic-vscode';
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path;
	const filename = basename(filepath);

	if (rootPath) {
		const dirPath = resolve(rootPath, MOVE_DIR_NAME);

		try {
			await access(dirPath, constants.F_OK);
		} catch (e) {
			await mkdir(dirPath, { recursive: true });
		}

		let originFilename = resolve(dirPath, filename);
		try {
			while (true) {
				await access(originFilename, constants.F_OK);
				originFilename = resolve(dirPath, renameImage(originFilename));
			};
		} catch (e) { }

		try {
			await access(filepath, constants.F_OK);
			const source = createReadStream(filepath);
			source.pipe(createWriteStream(originFilename));
			source.on("end", () => {
				rm(filepath, { force: true });
			});
		} catch (e) {
			console.log('e', e);
		}
	}
}

function renameImage(filename: string) {
	const suffix = extname(filename);
	return `${basename(filename.replace(/-\d*/, ''), suffix)}_${new Date().getTime()}${suffix}`;
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('upic-vscode.pasteCommand', async () => {
		// 执行vscode原本的粘贴操作
		await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
		const text = await vscode.env.clipboard.readText();
		// 获取粘贴后的选择区域信息
		if (text) {
			return;
		}
		setTimeout(async () => {
			const editor = vscode.window.activeTextEditor;

			if (editor) {
				const selection = editor.selection;
				const lineNumber = selection.active.line;
				const lineText = editor.document.lineAt(lineNumber).text;
				const replaceImage = [] as Array<ImageMeta>;
				const reg = /\!\[(.*)\]\((.*)\)/g;
				const match = lineText.match(reg);
				match?.forEach(item => {
					const reg = /\!\[(.*)\]\((.*)\)/;
					const matcher = item.match(reg);
					if (matcher) {
						const [originStr, name, imageName] = matcher;
						replaceImage.push({ originStr, name, imageName });
					}
				});

				const list = await uploadWithUPic(replaceImage);
				console.log('output list: ', list);
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

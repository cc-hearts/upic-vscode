import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { access, constants, mkdir, rename, rm } from 'fs/promises';
import { basename, dirname, extname, resolve } from 'path';
import * as vscode from 'vscode';

interface ImageMeta {
	originStr: string
	name: string
	imageName: string
}

async function uploadWithUPic(imageList: Array<ImageMeta>, fileDirectory: string) {
	const res = imageList.map(async (item) => {
		const filepath = resolve(fileDirectory, item.imageName);
		const renameFilepath = resolve(fileDirectory, renameImage(item.imageName));
		try {
			await rename(filepath, renameFilepath);
		} catch (e) {
			console.log('rename error: ', e);
		}

		const data = execSync(`/Applications/uPic.app/Contents/MacOS/uPic -u ${renameFilepath} -s`);
		console.log('command: ', `/Applications/uPic.app/Contents/MacOS/uPic -u ${renameFilepath} -s`);

		const reg = /http.*$/gm;
		const resultStr = data.toString();
		console.log('oss upload result: ', resultStr);

		const uploadPathList = resultStr.match(reg);
		if (uploadPathList) {
			const [uploadPath] = uploadPathList;
			moveFile(renameFilepath);
			return {
				originStr: item.originStr,
				newStr: item.originStr.replace(/\(.*\)/, `(${uploadPath})`)
			};
		}
		return null;
	});

	return Promise.all(res);
}

function textReplace(text: string, imageList: Array<{ originStr: string, newStr: string }>) {
	imageList.forEach((item) => {
		text = text.replace(item.originStr, item.newStr);
	});
	return text;
}

async function moveFile(filepath: string) {
	const MOVE_DIR_NAME = '.upic-vscode';

	const filename = basename(filepath);

	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path;
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
		} catch (e) {
			console.log('orginFilename is not exist: ', originFilename);
		}

		try {
			await access(filepath, constants.F_OK);
			const source = createReadStream(filepath);
			source.pipe(createWriteStream(originFilename));
			source.on("end", () => {
				rm(filepath, { force: true });
			});
		} catch (e) {
			console.log('[moveFile] image filepath is not exist:', e);
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
		if (text) { return; }

		setTimeout(async () => {
			const editor = vscode.window.activeTextEditor;

			if (editor) {
				const selection = editor.selection;
				const lineNumber = selection.active.line;
				const lineText = editor.document.lineAt(lineNumber).text;
				const fileDirectory = dirname(editor.document.uri.path);
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

				const imageToken = await uploadWithUPic(replaceImage, fileDirectory);
				console.log('image Token: ', imageToken);
				if (Array.isArray(imageToken) && imageToken.length > 0) {
					const _data = imageToken.filter(data => !!data) as Array<{ originStr: string, newStr: string }>;
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

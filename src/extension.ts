// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Linkable } from './treeView/codeElements';
import { DataProvider } from './treeView/dataProvider';
import { Loader } from './treeView/loader';
import { Command, Subsystem } from './treeView/treeType';
import { SubsystemCreator } from './webviews/subsystemCreator';
import { CommandCreator } from './webviews/commandCreator';

let providers:DataProvider[] = [];
let loader = new Loader(vscode.workspace.rootPath);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ler-botbuilder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let refreshCommand = vscode.commands.registerCommand('ler-botbuilder.refresh', () => {
		refresh();
	});
	let openCommand = vscode.commands.registerCommand('ler-botbuilder.openFile', (file) => {
		console.log(file);
		// if(file instanceof JavaClass){
		// 	vscode.workspace.openTextDocument((<JavaClass> file).srcFile).then(document => {
		// 		vscode.window.showTextDocument(document);
		// 	});
		if (file !== null && 'getTarget' in file){ // Check if file implements linkable
			let target = (<Linkable> file).getTarget();
			console.log(`Opening ${target.file}:${target.line}`);
			vscode.workspace.openTextDocument(target.file).then(document => {
				vscode.window.showTextDocument(document).then(editor => {
					if(target.line > 0){
						let pos = new vscode.Position(target.line-1, 0);
						editor.revealRange(new vscode.Range(pos, pos));
						editor.selection = new vscode.Selection(pos, pos);
					}
				});
			});
		}
	});
	let newSubsystemCommand = vscode.commands.registerCommand('ler-botbuilder.newSubsystem', ()=>{
		new SubsystemCreator(context).show();
	});
	let newCommandCommand = vscode.commands.registerCommand('ler-botbuilder.newCommand', ()=>{
		new CommandCreator(context).show();
	});

	loader.load().then(()=>{
		console.log("Registering");
		let d = new DataProvider(getSubsystems);
		providers.push(d);
		vscode.window.registerTreeDataProvider('subsystems', d);
		d = new DataProvider(getCommands);
		providers.push(d);
		vscode.window.registerTreeDataProvider('commands', d);
	});

	// fs.watch(vscode.workspace.rootPath +"/build/classes", {persistent:false, recursive:true}, (event, filename)=>{
	// 	console.log(event+":"+filename);
	// 	refresh(1000);
	// });

	context.subscriptions.push(refreshCommand);
	context.subscriptions.push(openCommand);
	context.subscriptions.push(newSubsystemCommand);
	context.subscriptions.push(newCommandCommand);
}



// this method is called when your extension is deactivated
export function deactivate() {}


// Timer optionally used by refresh to prevent multiple calls
var refreshTimer:NodeJS.Timeout = null;
/**
 * Refresh the treeview.
 * @param timeout A timeout with this duration will be created, if another call to refresh() is made before the timeout occurs, the refresh will be cancelled in favour of the newer one
 */
function refresh(timeout = 0){
	// Clear existing timer
	if(refreshTimer !== null){
		clearTimeout(refreshTimer);
	}

	refreshTimer = setTimeout(() => {
		console.log("Refreshing");
		loader.load().then(()=>{
			for(let p of providers){
				p.refresh();
			}
		});
	}, timeout);
}

export function getSubsystems(): Subsystem[]{
	return loader.subsystems;
}

export function getCommands(): Command[]{
	return loader.commands;
}
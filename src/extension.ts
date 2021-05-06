// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Linkable, TreeElement } from './treeView/codeElements';
import { DataProvider } from './treeView/dataProvider';
import { Loader } from './treeView/loader';
import { Command, Subsystem } from './treeView/treeType';
import { SubsystemCreator } from './webviews/subsystemCreator';
import { CommandCreator } from './webviews/commandCreator';
import getConfig, { loadConfig, setBasePackage } from './config';
import * as Path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { SetupView as SetupView } from './webviews/setupView';
import { JavaBase } from './javaParser/common';
import { JavaClass } from './javaParser/JavaClasses';
import { promisify } from 'util';

let providers:DataProvider[] = [];
let loader = new Loader(vscode.workspace.rootPath);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "botbuilder" is now active!');

	loadConfig(vscode.workspace.rootPath, Path.join(__dirname, "..", "..", "resources"));
	console.log(JSON.stringify(getConfig()));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let refreshCommand = vscode.commands.registerCommand('botbuilder.refresh', () => {
		buildCode();
	});
	let openCommand = vscode.commands.registerCommand('botbuilder.openFile', (file) => {
		console.log(file);
		// if(file instanceof JavaClass){
		// 	vscode.workspace.openTextDocument((<JavaClass> file).srcFile).then(document => {
		// 		vscode.window.showTextDocument(document);
		// 	});
		if (file !== null && 'getTarget' in file){ // Check if file implements linkable
			let target = (<Linkable> file).getTarget();
			openFile(target.file, target.line, target.column);
		}
	});
	
	
	let setupCommand = vscode.commands.registerCommand('botbuilder.setup', ()=>{
		if(getConfig() !== null){
			vscode.window.showInformationMessage("Botbuilder is already initialized for this workspace");
		} else {
			new SetupView(context).show();
		}
	});

	let newSubsystemCommand = vscode.commands.registerCommand('botbuilder.newSubsystem', ()=>{
		if(getConfig() === null){
			vscode.window.showInformationMessage("Botbuilder is not initialized for this workspace");
		} else {
			new SubsystemCreator(context, vscode.workspace.rootPath+"/"+getConfig().srcFolder).show();
		}
	});
	let newCommandCommand = vscode.commands.registerCommand('botbuilder.newCommand', ()=>{
		if(getConfig() === null){
			vscode.window.showInformationMessage("Botbuilder is not initialized for this workspace");
		} else {
			new CommandCreator(context, vscode.workspace.rootPath+"/"+getConfig().srcFolder).show();
		}
	});
	let runTestsCommand = vscode.commands.registerCommand("botbuilder.runTests", (file: TreeElement<JavaBase>) => {
		let element = file.element;
		if (file !== null && 'getTarget' in file){ // Check if file implements linkable
			runTests((<Linkable> file).getTarget().file, element.getName(false), element.descriptor);
		}
	});


	vscode.workspace.onDidSaveTextDocument(()=>{
		buildCode();
	});

	loader.load().then(()=>{
		for(let c of loader.classes){
			if(c.name === getConfig().baseClassName){
				setBasePackage(c.pckg);
			}
		}
		console.log("Registering");
		let d = new DataProvider(getSubsystems);
		providers.push(d);
		vscode.window.registerTreeDataProvider('subsystems', d);
		d = new DataProvider(getCommands);
		providers.push(d);
		vscode.window.registerTreeDataProvider('commands', d);
	});

	// fs.watch(vscode.workspace.rootPath+"/"+getConfig().buildFolder, {persistent:false, recursive:true}, (event, filename)=>{
	// 	console.log(event+":"+filename);
	// 	refresh(1000);
	// });

	context.subscriptions.push(refreshCommand);
	context.subscriptions.push(openCommand);
	context.subscriptions.push(newSubsystemCommand);
	context.subscriptions.push(newCommandCommand);
	context.subscriptions.push(setupCommand);
	context.subscriptions.push(runTestsCommand);
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

/**
 * Run `gradlew compileJava` and if it passes, run `gradlew build -x test`
 * @param ref If true, the refresh function will be called automatically
 */
export function buildCode(ref:boolean = true){
	cp.exec("gradlew compileJava", { cwd:getConfig().workspaceRoot }, (err, stdout, stderr) => {
		if(err !== null){
			console.log(err);
		} else {
			console.log(stdout);
			console.log(stderr);
			cp.exec("gradlew build -x test", { cwd:getConfig().workspaceRoot }, (err, stdout, stderr) => {
				if(err !== null){
					console.log(err);
				} else {
					console.log(stdout);
					console.log(stderr);
					if(ref){
						refresh();
					}
				}
			});
		}
	});
}

export function openFile(file:string, line:number=-1, col:vscode.ViewColumn=vscode.ViewColumn.Active){
	vscode.workspace.openTextDocument(file).then(document => {
		vscode.window.showTextDocument(document, col || vscode.ViewColumn.Active).then(editor => {
			if(line > 0){
				let pos = new vscode.Position(line-1, 0);
				editor.revealRange(new vscode.Range(pos, pos));
				editor.selection = new vscode.Selection(pos, pos);
			}
		});
	});
}

/**
 * Run all tests in a test class
 * @param path Path to the java file
 * @param name Name of class test are for (echoed back to user)
 * @param descriptor Java class descriptor (src/ca/example/MyClass)
 * @returns True if tasks are executed, otherwise false
 */
async function runTests(path:string, name:string, descriptor:string): Promise<boolean>{
	if(('testFolder' in getConfig())){ // If tests are configured, update path if not in tests folder
		if(!path.includes(getConfig().testFolder)){
			path = path.replace(getConfig().srcFolder, getConfig().testFolder).replace(".java", "Test.java");
		}
	} else if(fs.existsSync(path) && (await promisify(fs.readFile)(path)).includes("@Test")) { // If tests aren't included, check if test annotations are included in the specified file
		
	} else { // Otherwise, error and exit
		vscode.window.showErrorMessage("Tests are not configured with Botbuilder, and file not recognised as a test. Add testFolder to botbuilder.json");
		return false;
	}
	if(fs.existsSync(path)){ // If the file exists, make a new shell and run the command
		let shell = new vscode.ShellExecution(
			`echo 'Running tests for ${name}' && ./gradlew test --tests ${(descriptor+"Test").split("/").join(".")} --warning-mode none --build-cache`);
		let task = new vscode.Task({type: "runtests"}, vscode.workspace.workspaceFolders[0], "Run Tests", 'botbuilder', shell);
		task.presentationOptions.echo = false;
		task.presentationOptions.showReuseMessage = false;
		vscode.tasks.executeTask(task);
		return true;
	} else {
		vscode.window.showErrorMessage("File not found: "+path.replace(vscode.workspace.rootPath+"/", ""));
		return false;
	}
}
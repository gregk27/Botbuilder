// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { Subsystem, Command } from './treeType';
import { Method, Constant, Enum, ReferencedSubsystem } from './codeElements';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ler-botbuilder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ler-botbuilder.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from LER BotBuilder!');
	});
	vscode.window.registerTreeDataProvider('subsystems', new DataProvider(getSubsystems));
	vscode.window.registerTreeDataProvider('commands', new DataProvider(getCommands));

	context.subscriptions.push(disposable);
}



// this method is called when your extension is deactivated
export function deactivate() {}

function getSubsystems(): Subsystem[]{
	return [
		new Subsystem("Drivetrain", "src/robot/subsystems/Drivetrain.java", 
			"The subsystem representing the drivetrain<br/>This controls the 6 {@link neos}", 
			[new Method("drive(double l, double r)", "Set the drivetrain speeds\n@param l Left speed\n@param r Right speed"),
			 new Constant("MAX_SPEED", "The max speed the drivetrain can achieve"),
			 new Enum("Sides", "Drivetrain sides", ["LEFT", "RIGHT"])]
		),
		new Subsystem("Shooter", "src/robot/subsystems/Shooter.java", 
			"Subsystem to control Shooter wheels", 
			[]
		)
		];
}

function getCommands(): Command[]{
	return [
		new Command("DriveCommand", "src/main/java/ler/robot/commands/DriveCommand.java", 
		"A command to drive the robot with joystick input (passed in as {@link DoubleSupplier}s). Written\nexplicitly for pedagogical purposes - actual code should inline a command this simple with {@link\nedu.wpi.first.wpilibj2.command.RunCommand}.",
		[new ReferencedSubsystem("Drivetrain", "Drivetrain", true)]
		),
		new Command("Auto", "", "", [], Command.AUTO),
		new Command("Instant", "", "", [], Command.INSTANT),
		new Command("IntakeExtendCommand", "src/main/java/ler/robot/commands/instant/IntakeExtendCommand.java", 
		"Extend the intake",
		[new ReferencedSubsystem("Intake", "Intake", true), 
		new ReferencedSubsystem("Conveyor", "Conveyor", false)],
		Command.AUTO | Command.INSTANT
		)
	];
}
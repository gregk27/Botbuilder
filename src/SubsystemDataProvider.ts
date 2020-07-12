import * as vscode from 'vscode';
import { join } from 'path';
import { CodeElement,Method,Constant,Enum,EnumItem } from './codeElements';

export class SubsystemDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    constructor() {
        console.log("Construct");
    }

    onDidChangeTreeData?: vscode.Event<void | Subsystem | null | undefined> | undefined;
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        console.log("Get tree item");
        return element;
    }
    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        console.log("Get children" + element);
        if(element instanceof Subsystem){
            console.log(element);
            console.log(element.elements);
            return element.elements;
        } else if (element instanceof CodeElement){
            return element.children;
        } else {
            console.log("Showing drivetrain subsystem");
            return [new Subsystem("Drivetrain", "src/robot/subsystems/Drivetrain.java", "The subsystem representing the drivetrain<br/>This controls the 6 {@link neos}", vscode.TreeItemCollapsibleState.Collapsed)];
        }
    }
    
}

class Subsystem extends vscode.TreeItem {
    
    elements: CodeElement[];

    constructor(
        public readonly label: string,
        public readonly path: string,
        public readonly javadoc: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState   
    )  {
        super(label, collapsibleState);
        this.elements = [new Method("drive(double l, double r)", "Set the drivetrain speeds\n@param l Left speed\n@param r Right speed"),
                        new Constant("MAX_SPEED", "The max speed the drivetrain can achieve"),
                        new Enum("Sides", "Drivetrain sides", ["LEFT", "RIGHT"])];
    }

    get tooltip(): string {
        return this.javadoc.replace("<br/>", "\n");
    }

    get description(): string {
        return this.path;
    }

    iconPath = {
        dark: join(__filename, "..", "..", "resources", "dark", "subsystem.svg"),
        light: join(__filename, "..", "..", "resources", "light", "subsystem.svg")
    };
}
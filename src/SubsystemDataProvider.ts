import * as vscode from 'vscode';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { systemDefaultPlatform } from 'vscode-test/out/util';

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
            console.log(element.funs);
            return element.funs;
        } else {
            console.log("Showing drivetrain subsystem");
            return [new Subsystem("Drivetrain", "src/robot/subsystems/Drivetrain.java", "The subsystem representing the drivetrain<br/>This controls the 6 {@link neos}", vscode.TreeItemCollapsibleState.Collapsed)];
        }
    }
    
}

class Subsystem extends vscode.TreeItem {
    
    funs: Function[];

    constructor(
        public readonly label: string,
        public readonly path: string,
        public readonly javadoc: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState   
    )  {
        super(label, collapsibleState);
        this.funs = [new Function("drive(double l, double r)", "Set the drivetrain speeds\n@param l Left speed\n@param r Right speed", vscode.TreeItemCollapsibleState.None)];
    }

    get tooltip(): string {
        return this.javadoc.replace("<br/>", "\n");
    }

    get description(): string {
        return this.path;
    }

    iconPath = {
        dark: join(__filename, "..", "..", "resources", "subsystem.svg"),
        light: join(__filename, "..", "..", "resources", "subsystem.svg")
    };
}

class Function extends vscode.TreeItem{

    constructor(
        public readonly label: string,
        public readonly javadoc: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState   
    )  {
        super(label, collapsibleState);
    }

    get tooltip(): string {
        return this.javadoc.replace("<br/>", "\n");
    }

    get description(): string {
        return this.javadoc;
    }

    iconPath = {
        dark: join(__filename, "..", "..", "resources", "vscode", "method.svg"),
        light: join(__filename, "..", "..", "resources", "vscode", "method.svg")
    };
}
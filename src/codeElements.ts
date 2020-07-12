import * as vscode from 'vscode';
import * as Path from 'path';

export class CodeElement extends vscode.TreeItem{
    
    children: CodeElement[] = [];
    
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
        private readonly iconName: string,
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
        dark: Path.join(__filename, "..", "..", "resources", "dark", "vscode", this.iconName+".svg"),
        light: Path.join(__filename, "..", "..", "resources", "light", "vscode", this.iconName+".svg")
    };
}

export class Field extends CodeElement{
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
    )  {
        super(label, javadoc, "field", vscode.TreeItemCollapsibleState.None);
    }
}
export class Constant extends CodeElement{
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
    )  {
        super(label, javadoc, "constant", vscode.TreeItemCollapsibleState.None);
    }
}
export class Method extends CodeElement{
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
    )  {
        super(label, javadoc, "method", vscode.TreeItemCollapsibleState.None);
    }
}

export class Enum extends CodeElement{
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
        children: string[]
    )  {
        super(label, javadoc, "enum", vscode.TreeItemCollapsibleState.Collapsed);
        for(let s of children){
            this.children.push(new EnumItem(s, ""));
        }
    }
}

export class EnumItem extends CodeElement{
    constructor(
        public readonly label: string,
        public readonly javadoc: string,
    )  {
        super(label, javadoc, "enumItem", vscode.TreeItemCollapsibleState.None);
    }
}
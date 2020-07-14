import * as vscode from 'vscode';
import { TreeType } from './treeType';
import { CodeElement } from './codeElements';

export class DataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    constructor(private getter: ()=>TreeType[]){
        
    }
    
    onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | null | undefined> | undefined;
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if(element instanceof TreeType){
            return element.elements;
        } else if (element instanceof CodeElement){
            return element.children;
        } else {
            return this.getter();
        }
    }

}
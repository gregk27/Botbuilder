import * as vscode from 'vscode';
import { TreeType } from './treeType';
import { TreeElement } from './codeElements';

export class DataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    constructor(private getter: ()=>TreeType[]){
        
    }
    
    onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | null | undefined> | undefined;
    getTreeItem(element: TreeElement | vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if(element instanceof vscode.TreeItem){
            return element;
        } else {
            return TreeElement.getTreeItem(element);
        }
    }
    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if(element instanceof TreeType){
            return element.elements;
        } else if ('children' in element){
            return (<TreeElement> element).children;
        } else {
            return this.getter();
        }
    }

}